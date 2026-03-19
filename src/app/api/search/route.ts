import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import type { Database, Generation } from '@/types/database'

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

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      query: string
      category?: string
      model?: string
      limit?: number
      threshold?: number
    }

    const { query, category, model, limit = 24, threshold = 0.5 } = body

    if (!query?.trim()) {
      return NextResponse.json({ error: 'query is required' }, { status: 400 })
    }

    // Explicit key check with clear error message
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey || apiKey === 'sk-proj-PASTE_YOUR_KEY_HERE') {
      console.error('OPENAI_API_KEY is not set or still a placeholder')
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    // 1. Embed the query with text-embedding-3-small
    const openai = new OpenAI({ apiKey })
    const embeddingRes = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query.trim(),
    })
    const embedding = embeddingRes.data[0].embedding

    // 2. Call the Supabase RPC — returns limited fields + similarity score
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rpcData, error: rpcError } = await (supabase as any).rpc('search_prompts', {
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: limit,
      filter_category: category ?? null,
      filter_model: model ?? null,
    })

    if (rpcError) {
      console.error('Supabase RPC error:', rpcError)
      return NextResponse.json({ error: rpcError.message }, { status: 500 })
    }

    const rpcRows: RpcRow[] = (rpcData as RpcRow[]) ?? []

    if (rpcRows.length === 0) {
      return NextResponse.json({ results: [], query })
    }

    // 3. Build a similarity lookup keyed by job_set_id
    const similarityMap = new Map<string, number>(
      rpcRows.map((r) => [r.job_set_id, r.similarity]),
    )

    // 4. Fetch full generation records (includes output_image_url, output_image_url_min, etc.)
    const ids = rpcRows.map((r) => r.job_set_id)
    const { data: fullData, error: fullError } = await supabase
      .from('generations')
      .select('*')
      .in('job_set_id', ids)

    if (fullError) {
      console.error('Generations fetch error:', fullError)
      return NextResponse.json({ error: fullError.message }, { status: 500 })
    }

    const fullRecords = (fullData as Generation[]) ?? []

    // 5. Merge full records with similarity scores, preserving RPC order
    const resultMap = new Map<string, SemanticResult>()
    for (const gen of fullRecords) {
      const similarity = similarityMap.get(gen.job_set_id) ?? 0
      resultMap.set(gen.job_set_id, { ...gen, similarity })
    }

    // Re-order to match RPC ranking (highest similarity first)
    const results: SemanticResult[] = ids
      .map((id) => resultMap.get(id))
      .filter((r): r is SemanticResult => r !== undefined)

    return NextResponse.json({ results, query })
  } catch (err) {
    console.error('Semantic search error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
