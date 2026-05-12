import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import {
  withApiAuth,
  apiError,
  corsPreflight,
  withCors,
} from '@/lib/api-middleware'

const ENDPOINT = '/api/v1/search'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

interface SearchBody {
  query?: unknown
  limit?: unknown
  filters?: { category?: unknown; model?: unknown }
}

interface SearchRpcRow {
  job_set_id: string
  prompt: string | null
  model: string | null
  similarity: number
  primary_category: string | null
  sub_category: string | null
  visual_style: string | null
  lighting: string | null
  mood: string | null
}

async function searchHandler(req: NextRequest): Promise<NextResponse> {
  let body: SearchBody
  try {
    body = (await req.json()) as SearchBody
  } catch {
    return apiError('bad_request', 'Request body must be valid JSON', 400)
  }

  const query = typeof body.query === 'string' ? body.query.trim() : ''
  if (!query) return apiError('bad_request', 'query is required', 400)

  const rawLimit = typeof body.limit === 'number' ? body.limit : 10
  const safeLimit = Math.min(Math.max(1, Math.floor(rawLimit)), 40)

  const filters = body.filters ?? {}
  const category = typeof filters.category === 'string' && filters.category ? filters.category : null
  const model    = typeof filters.model    === 'string' && filters.model    ? filters.model    : null

  const openaiKey = process.env.OPENAI_API_KEY
  if (!openaiKey || openaiKey === 'sk-proj-PASTE_YOUR_KEY_HERE') {
    return apiError('internal_error', 'Search service unavailable', 500)
  }

  const openai = new OpenAI({ apiKey: openaiKey })

  const embeddingRes = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query.slice(0, 8000),
  })
  const embedding = embeddingRes.data[0].embedding

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rpcData, error: rpcError } = await (supabase as any).rpc('search_prompts', {
    query_embedding: embedding,
    match_threshold: 0.15,
    match_count: safeLimit,
    filter_category: category,
    filter_model: model,
  })

  if (rpcError) {
    console.error('[/api/v1/search] RPC error:', rpcError)
    return apiError('search_failed', rpcError.message, 500)
  }

  const rpcRows = (rpcData ?? []) as SearchRpcRow[]

  // search_prompts RPC doesn't return composition; fetch it for the matched ids
  // so we can populate the elements field without altering the RPC.
  const compositionByJobSetId = new Map<string, string | null>()
  if (rpcRows.length > 0) {
    const ids = rpcRows.map((r) => r.job_set_id)
    const { data: extras, error: extrasErr } = await supabase
      .from('generations')
      .select('job_set_id, composition')
      .in('job_set_id', ids)
    if (extrasErr) {
      // Non-fatal — just skip the enrichment and return null compositions.
      console.warn('[/api/v1/search] composition lookup failed:', extrasErr.message)
    } else {
      for (const r of (extras as Array<{ job_set_id: string; composition: string | null }> | null) ?? []) {
        compositionByJobSetId.set(r.job_set_id, r.composition)
      }
    }
  }

  const results = rpcRows.map((row) => {
    const composition = compositionByJobSetId.get(row.job_set_id) ?? null
    const firstSentence = row.prompt
      ? row.prompt.split('.')[0]?.trim() || null
      : null
    return {
      id: row.job_set_id,
      prompt: row.prompt,
      model: row.model,
      similarity: row.similarity,
      // Lightweight elements derived from existing classification fields.
      // For a full 8-field structured parse, call /api/v1/parse with `prompt`.
      elements: {
        subject: firstSentence,
        action_pose: null,
        setting: null,
        lighting: row.lighting || null,
        composition: composition,
        style: row.visual_style || null,
        mood: row.mood || null,
        technical: null,
      },
      metadata: {
        primary_category: row.primary_category,
        sub_category: row.sub_category,
        visual_style: row.visual_style,
        lighting: row.lighting,
        mood: row.mood,
        composition: composition,
      },
    }
  })

  return NextResponse.json({ results, total: results.length, query })
}

export const POST = withApiAuth(ENDPOINT, searchHandler)

export function OPTIONS(): NextResponse {
  return corsPreflight()
}

// Block other verbs explicitly with a clean JSON error and CORS headers.
export function GET(): NextResponse {
  return withCors(
    NextResponse.json(
      { error: { code: 'method_not_allowed', message: 'Use POST' } },
      { status: 405 },
    ),
  )
}
