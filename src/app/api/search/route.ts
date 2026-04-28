import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import type { Database, Generation } from '@/types/database'
import {
  matchesSearchFilters,
  type SearchPillState,
  type SearchSidebarState,
} from '@/lib/search-filter-options'
import { GENERATION_GRID_SELECT } from '@/lib/generation-grid-select'
import { rateLimit } from '@/lib/rate-limit'

// Server-side Supabase client (uses same anon key — RLS allows public reads)
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

// Shape returned by search_prompts RPC — only metadata + similarity
interface RpcRow {
  id: string
  job_set_id: string
  prompt: string | null
  model: string | null
  primary_category: string | null
  sub_category: string | null
  visual_style: string | null
  lighting: string | null
  mood: string | null
  views_count: number | null
  likes_count: number | null
  similarity: number
}

// Full result shape we return to the client — Generation + similarity
export type SemanticResult = Generation & { similarity: number }

function parseStoredEmbedding(value: unknown): number[] | null {
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'number') {
    return value as number[]
  }
  if (typeof value === 'string') {
    const s = value.trim()
    if (s.startsWith('[')) {
      try {
        const parsed = JSON.parse(s) as unknown
        if (Array.isArray(parsed) && parsed.every((x) => typeof x === 'number')) {
          return parsed as number[]
        }
      } catch {
        /* fall through */
      }
    }
    const parts = s.replace(/^\[/, '').replace(/\]$/, '').split(',')
    const nums = parts.map((p) => Number.parseFloat(p.trim())).filter((n) => !Number.isNaN(n))
    return nums.length > 0 ? nums : null
  }
  return null
}

function optStr(v: unknown): string | null {
  if (v == null || v === '') return null
  return typeof v === 'string' ? v : String(v)
}

function strArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((x): x is string => typeof x === 'string')
}

function pillSidebarFromBody(body: Record<string, unknown>): {
  pills: SearchPillState
  sidebar: SearchSidebarState
} {
  const pills: SearchPillState = {
    model: optStr(body.model),
    category: optStr(body.category),
    aspect_ratio: optStr(body.aspect_ratio),
    visual_style: optStr(body.visual_style),
  }
  const sidebar: SearchSidebarState = {
    visual_style: strArray(body.sidebar_visual_style),
    lighting: strArray(body.sidebar_lighting),
    mood: strArray(body.sidebar_mood),
    composition: strArray(body.sidebar_composition),
    camera_simulation: strArray(body.sidebar_camera_simulation),
  }
  return { pills, sidebar }
}

function hasExtraSearchFilters(pills: SearchPillState, sidebar: SearchSidebarState): boolean {
  return !!(
    pills.aspect_ratio ||
    pills.visual_style ||
    sidebar.visual_style.length ||
    sidebar.lighting.length ||
    sidebar.mood.length ||
    sidebar.composition.length ||
    sidebar.camera_simulation.length
  )
}

export async function POST(req: Request) {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() ?? 'unknown'
  const { allowed } = rateLimit(ip, 30, 60_000)

  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment.' },
      {
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Remaining': '0',
        },
      },
    )
  }

  try {
    const body = (await req.json()) as Record<string, unknown> & {
      query?: string
      similar_job_set_id?: string
      category?: string
      model?: string
      limit?: number
      threshold?: number
      offset?: number
      aspect_ratio?: string | null
      visual_style?: string | null
      sidebar_visual_style?: string[]
      sidebar_lighting?: string[]
      sidebar_mood?: string[]
      sidebar_composition?: string[]
      sidebar_camera_simulation?: string[]
    }

    const { query, similar_job_set_id, category, model, threshold = 0.15 } = body
    const { pills: filterPills, sidebar: filterSidebar } = pillSidebarFromBody(body)
    const offset = typeof body.offset === 'number' && body.offset >= 0 ? body.offset : 0
    const limit = Math.min(typeof body.limit === 'number' && body.limit > 0 ? body.limit : 40, 80)

    const rpcCategory = category ?? filterPills.category ?? null
    const rpcModel = model ?? filterPills.model ?? null

    // Explicit key check with clear error message
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey || apiKey === 'sk-proj-PASTE_YOUR_KEY_HERE') {
      console.error('OPENAI_API_KEY is not set or still a placeholder')
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    const openai = new OpenAI({ apiKey })

    let embedding: number[]
    let queryEcho: string

    if (similar_job_set_id?.trim()) {
      const { data: row, error: rowErr } = await supabase
        .from('generations')
        .select('prompt_embedding, prompt')
        .eq('job_set_id', similar_job_set_id.trim())
        .maybeSingle()

      if (rowErr) {
        console.error('similar_job_set_id fetch error:', rowErr)
        return NextResponse.json({ error: rowErr.message }, { status: 500 })
      }

      const fromDb = parseStoredEmbedding((row as { prompt_embedding?: unknown } | null)?.prompt_embedding)
      const promptText = (row as { prompt?: string | null } | null)?.prompt?.trim() ?? ''

      if (fromDb && fromDb.length > 0) {
        embedding = fromDb
        queryEcho = promptText || similar_job_set_id.trim()
      } else if (promptText) {
        const embeddingRes = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: promptText.slice(0, 8000),
        })
        embedding = embeddingRes.data[0].embedding
        queryEcho = promptText
      } else {
        return NextResponse.json({ error: 'similar_job_set_id not found or has no prompt' }, { status: 400 })
      }
    } else if (query?.trim()) {
      const embeddingRes = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: query.trim(),
      })
      embedding = embeddingRes.data[0].embedding
      queryEcho = query.trim()
    } else {
      return NextResponse.json({ error: 'query or similar_job_set_id is required' }, { status: 400 })
    }

    const extra = hasExtraSearchFilters(filterPills, filterSidebar)
    const rpcMatchCount = Math.min(
      800,
      Math.max(96, offset + limit + (extra ? 400 : 120)),
    )

    // 2. Call the Supabase RPC — returns limited fields + similarity score
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rpcData, error: rpcError } = await (supabase as any).rpc('search_prompts', {
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: rpcMatchCount,
      filter_category: rpcCategory,
      filter_model: rpcModel,
    })

    if (rpcError) {
      console.error('Supabase RPC error:', rpcError)
      return NextResponse.json({ error: rpcError.message }, { status: 500 })
    }

    const rpcRows: RpcRow[] = (rpcData as RpcRow[]) ?? []

    if (rpcRows.length === 0) {
      return NextResponse.json({ results: [], query: queryEcho, totalCount: 0, hasMore: false })
    }

    // 3. Build a similarity lookup keyed by job_set_id
    const similarityMap = new Map<string, number>(
      rpcRows.map((r) => [r.job_set_id, r.similarity]),
    )

    // 4. Fetch full generation records (includes output_image_url, output_image_url_min, etc.)
    const ids = rpcRows.map((r) => r.job_set_id)
    const { data: fullData, error: fullError } = await supabase
      .from('generations')
      .select(GENERATION_GRID_SELECT)
      .in('job_set_id', ids)

    if (fullError) {
      console.error('Generations fetch error:', fullError)
      return NextResponse.json({ error: fullError.message }, { status: 500 })
    }

    const fullRecords = (fullData as Generation[]) ?? []

    // 5. Merge full records with similarity scores; sort below keeps RPC similarity order with tie-breaks
    const resultMap = new Map<string, SemanticResult>()
    for (const gen of fullRecords) {
      const similarity = similarityMap.get(gen.job_set_id) ?? 0
      resultMap.set(gen.job_set_id, { ...gen, similarity })
    }

    // Rank by similarity (RPC order), then break ties with originals first
    const results: SemanticResult[] = ids
      .map((id) => resultMap.get(id))
      .filter((r): r is SemanticResult => r !== undefined)

    results.sort((a, b) => {
      const sim = (b.similarity ?? 0) - (a.similarity ?? 0)
      if (sim !== 0) return sim
      return (a.sort_priority ?? 1) - (b.sort_priority ?? 1)
    })

    const filtered = results.filter((g) => matchesSearchFilters(g, filterPills, filterSidebar))
    const totalCount = filtered.length
    const page = filtered.slice(offset, offset + limit)
    const hasMore =
      page.length === limit &&
      (filtered.length > offset + limit || rpcRows.length >= rpcMatchCount)

    return NextResponse.json({ results: page, query: queryEcho, totalCount, hasMore })
  } catch (err) {
    console.error('Semantic search error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
