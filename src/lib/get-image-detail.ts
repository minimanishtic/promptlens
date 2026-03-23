import { createClient } from '@supabase/supabase-js'
import type { Database, Generation } from '@/types/database'

function db() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

/** Minimal fields for generateMetadata on the image route */
export async function getImageSeoFields(jobSetId: string) {
  const supabase = db()
  const { data } = await supabase
    .from('generations')
    .select('prompt, primary_category, visual_style, output_image_url_min, output_image_url')
    .eq('job_set_id', jobSetId)
    .single()
  return data as {
    prompt: string | null
    primary_category: string | null
    visual_style: string | null
    output_image_url_min: string | null
    output_image_url: string | null
  } | null
}

export async function getImageDetailPayload(jobSetId: string): Promise<{
  gen: Generation
  similarImages: Generation[]
} | null> {
  const supabase = db()
  const { data: image, error } = await supabase
    .from('generations')
    .select('*')
    .eq('job_set_id', jobSetId)
    .single()

  if (error || !image) return null

  const gen = image as Generation

  let similarImages: Generation[] = []
  if (gen.primary_category || gen.visual_style) {
    let query = supabase
      .from('generations')
      .select('*')
      .neq('job_set_id', jobSetId)
      .order('sort_priority', { ascending: true })
      .order('views_count', { ascending: false })
      .limit(8)

    if (gen.primary_category) query = query.eq('primary_category', gen.primary_category)
    if (gen.visual_style) query = query.eq('visual_style', gen.visual_style)

    const { data } = await query
    if (data) similarImages = data as Generation[]
  }

  return { gen, similarImages }
}
