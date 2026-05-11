import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  withApiAuth,
  apiError,
  corsPreflight,
  withCors,
} from '@/lib/api-middleware'

// Use a separate endpoint key for rate-limiting (no per-endpoint limit configured —
// falls through to "no daily cap" behavior; auth still required).
const ENDPOINT = '/api/v1/prompts'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

const PROMPT_SELECT = [
  'job_set_id',
  'model',
  'prompt',
  'visual_style',
  'lighting',
  'mood',
  'composition',
  'camera_simulation',
  'primary_category',
  'sub_category',
  'reference_usage',
  'width',
  'height',
  'aspect_ratio',
  'output_image_url',
  'output_image_url_min',
  'views_count',
].join(',')

async function promptHandler(req: NextRequest): Promise<NextResponse> {
  // Pathname is /api/v1/prompts/<id> — pull the last segment.
  const segments = req.nextUrl.pathname.split('/').filter(Boolean)
  const id = segments[segments.length - 1]
  if (!id) {
    return apiError('bad_request', 'Prompt ID is required', 400)
  }

  const { data, error } = await supabase
    .from('generations')
    .select(PROMPT_SELECT)
    .eq('job_set_id', id)
    .maybeSingle()

  if (error) {
    console.error('[/api/v1/prompts/:id] DB error:', error)
    return apiError('internal_error', 'Failed to fetch prompt', 500)
  }
  if (!data) {
    return apiError('not_found', 'Prompt not found', 404)
  }

  const row = data as unknown as Record<string, unknown>
  return NextResponse.json({
    id: row.job_set_id,
    prompt: row.prompt,
    model: row.model,
    thumbnail_url: row.output_image_url_min ?? row.output_image_url,
    dimensions: {
      width: row.width,
      height: row.height,
      aspect_ratio: row.aspect_ratio,
    },
    metadata: {
      primary_category: row.primary_category,
      sub_category: row.sub_category,
      visual_style: row.visual_style,
      lighting: row.lighting,
      mood: row.mood,
      composition: row.composition,
      camera_simulation: row.camera_simulation,
      reference_usage: row.reference_usage,
    },
    views: row.views_count,
  })
}

export const GET = withApiAuth(ENDPOINT, promptHandler)

export function OPTIONS(): NextResponse {
  return corsPreflight()
}

export function POST(): NextResponse {
  return withCors(
    NextResponse.json(
      { error: { code: 'method_not_allowed', message: 'Use GET' } },
      { status: 405 },
    ),
  )
}
