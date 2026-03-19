import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Server-side Supabase client (uses same anon key — RLS allows public reads)
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

export interface SemanticResult {
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
  output_image_url: string | null
  output_image_url_min: string | null
  similarity: number
}

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

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    // 1. Embed the query with text-embedding-3-small
    const openai = new OpenAI({ apiKey })
    const embeddingRes = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query.trim(),
    })
    const embedding = embeddingRes.data[0].embedding

    // 2. Call the Supabase RPC function
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('search_prompts', {
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: limit,
      filter_category: category ?? null,
      filter_model: model ?? null,
    })

    if (error) {
      console.error('Supabase RPC error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 3. Map RPC results to our result shape
    // The RPC may return storage paths — map to CDN URLs if needed
    const results: SemanticResult[] = ((data as SemanticResult[]) ?? []).map((row) => ({
      ...row,
      // Normalise CDN URL fields — RPC may return storage_output_path instead
      output_image_url: row.output_image_url ?? null,
      output_image_url_min: row.output_image_url_min ?? null,
    }))

    return NextResponse.json({ results, query })
  } catch (err) {
    console.error('Semantic search error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
