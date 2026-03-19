import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database, Generation } from '@/types/database'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

export type StepName = 'category' | 'visual_style' | 'lighting' | 'mood' | 'composition' | 'model'

// ── Wizard option types ───────────────────────────────────────────────────────

export interface WizardOption {
  value: string
  images: string[]          // 1-2 thumbnail URLs
  count: number
  avg_views?: number
  recommended?: boolean
}

export interface WizardStepData {
  step: StepName
  options: WizardOption[]
}

// ── Result types ──────────────────────────────────────────────────────────────

export interface BuilderResult {
  prompts: Generation[]
  relaxedLevel: number   // 0 = exact match, 1 = dropped comp, 2 = dropped mood, 3 = dropped lighting
}

// ── Step definitions ──────────────────────────────────────────────────────────

const CATEGORIES = [
  'Portrait & Headshot',
  'Fashion & Style',
  'Landscape & Nature',
  'Architecture & Interior',
  'Product & Commercial',
  'Abstract & Artistic',
  'Sports & Action',
  'Food & Lifestyle',
]

const VISUAL_STYLES = ['Photorealistic', 'Editorial', 'Cinematic', 'Vintage/Film', 'Anime/Illustration', 'Raw/Candid']
const LIGHTINGS     = ['Studio', 'Natural/Golden Hour', 'Flash/Harsh', 'Moody/Low-key', 'Neon/Colored', 'Backlit']
const MOODS         = ['Warm', 'Cold', 'Dramatic', 'Intimate', 'Energetic', 'Nostalgic', 'Dark/Gritty', 'Clean/Minimal']
const COMPOSITIONS  = ['Close-up', 'Medium Shot', 'Full Body', 'Wide/Establishing', 'Overhead/Flat Lay', 'POV/First Person']

// ── Main handler ──────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      action: 'step' | 'results'
      step?: StepName
      selections?: Record<string, string>
    }

    if (body.action === 'step') {
      return NextResponse.json(await handleStep(body.step!, body.selections ?? {}))
    }
    if (body.action === 'results') {
      return NextResponse.json(await handleResults(body.selections ?? {}))
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    console.error('Builder API error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// ── Step handler ──────────────────────────────────────────────────────────────

async function handleStep(step: StepName, selections: Record<string, string>): Promise<WizardStepData> {
  switch (step) {
    case 'category':
      return fetchCategoryStep()
    case 'visual_style':
      return fetchOptionStep('visual_style', VISUAL_STYLES, { primary_category: selections.category }, 2)
    case 'lighting':
      return fetchOptionStep('lighting', LIGHTINGS, {
        primary_category: selections.category,
        visual_style: selections.visual_style,
      }, 2)
    case 'mood':
      return fetchOptionStep('mood', MOODS, {
        primary_category: selections.category,
        visual_style: selections.visual_style,
        lighting: selections.lighting,
      }, 2)
    case 'composition':
      return fetchOptionStep('composition', COMPOSITIONS, {
        primary_category: selections.category,
        visual_style: selections.visual_style,
        lighting: selections.lighting,
        mood: selections.mood,
      }, 2)
    case 'model':
      return fetchModelStep(selections)
    default:
      return { step, options: [] }
  }
}

async function fetchCategoryStep(): Promise<WizardStepData> {
  const options = await Promise.all(
    CATEGORIES.map(async (cat) => {
      const { data, count } = await supabase
        .from('generations')
        .select('output_image_url_min, output_image_url', { count: 'exact' })
        .eq('primary_category', cat)
        .not('output_image_url', 'is', null)
        .order('views_count', { ascending: false })
        .limit(1)

      const row = data?.[0] as { output_image_url_min: string | null; output_image_url: string | null } | undefined
      const img = row?.output_image_url_min ?? row?.output_image_url ?? ''
      return { value: cat, images: img ? [img] : [], count: count ?? 0 }
    }),
  )
  return { step: 'category', options }
}

async function fetchOptionStep(
  column: string,
  values: string[],
  filters: Record<string, string | undefined>,
  imageCount: number,
): Promise<WizardStepData> {
  const options = await Promise.all(
    values.map(async (val) => {
      const allFilters = { ...filters, [column]: val }

      let q = supabase
        .from('generations')
        .select('output_image_url_min, output_image_url', { count: 'exact' })
        .not('output_image_url', 'is', null)
        .order('views_count', { ascending: false })
        .limit(imageCount)

      for (const [col, v] of Object.entries(allFilters)) {
        if (v) q = q.eq(col, v)
      }

      const { data, count } = await q
      const images = ((data ?? []) as { output_image_url_min: string | null; output_image_url: string | null }[])
        .map((r) => r.output_image_url_min ?? r.output_image_url ?? '')
        .filter(Boolean)

      return { value: val, images, count: count ?? 0 }
    }),
  )
  return { step: column as StepName, options }
}

async function fetchModelStep(selections: Record<string, string>): Promise<WizardStepData> {
  const { data } = await supabase
    .from('generations')
    .select('model, views_count, output_image_url_min, output_image_url')
    .eq('primary_category', selections.category ?? '')
    .eq('visual_style', selections.visual_style ?? '')
    .eq('lighting', selections.lighting ?? '')
    .eq('mood', selections.mood ?? '')
    .eq('composition', selections.composition ?? '')
    .not('model', 'is', null)
    .not('output_image_url', 'is', null)
    .order('views_count', { ascending: false })
    .limit(500)

  type Row = { model: string; views_count: number; output_image_url_min: string | null; output_image_url: string | null }
  const rows = (data ?? []) as Row[]

  const agg = new Map<string, { total: number; count: number; imgs: string[] }>()
  for (const r of rows) {
    if (!r.model) continue
    if (!agg.has(r.model)) agg.set(r.model, { total: 0, count: 0, imgs: [] })
    const entry = agg.get(r.model)!
    entry.total += r.views_count ?? 0
    entry.count += 1
    if (entry.imgs.length < 2) {
      const img = r.output_image_url_min ?? r.output_image_url
      if (img) entry.imgs.push(img)
    }
  }

  const options: WizardOption[] = [...agg.entries()]
    .map(([model, { total, count, imgs }]) => ({
      value: model,
      images: imgs,
      count,
      avg_views: Math.round(total / count),
    }))
    .sort((a, b) => (b.avg_views ?? 0) - (a.avg_views ?? 0))

  if (options.length > 0) options[0].recommended = true

  return { step: 'model', options }
}

// ── Results handler ───────────────────────────────────────────────────────────

async function handleResults(selections: Record<string, string>): Promise<BuilderResult> {
  const { category, visual_style, lighting, mood, composition, model } = selections

  // Try progressively relaxed filter sets
  type FilterSet = { relaxedLevel: number; [key: string]: string | undefined | number }
  const filterSets: FilterSet[] = [
    { primary_category: category, visual_style, lighting, mood, composition, model, relaxedLevel: 0 },
    { primary_category: category, visual_style, lighting, mood, model, relaxedLevel: 1 },
    { primary_category: category, visual_style, lighting, model, relaxedLevel: 2 },
    { primary_category: category, visual_style, model, relaxedLevel: 3 },
    { primary_category: category, model, relaxedLevel: 4 },
  ]

  for (const { relaxedLevel, ...filters } of filterSets) {
    let q = supabase
      .from('generations')
      .select('*')
      .eq('has_prompt', true)
      .not('output_image_url', 'is', null)
      .not('prompt', 'is', null)
      .order('views_count', { ascending: false })
      .limit(5)

    for (const [col, val] of Object.entries(filters)) {
      if (val) q = q.eq(col, val)
    }

    const { data } = await q
    if (data && data.length > 0) {
      return { prompts: data as Generation[], relaxedLevel }
    }
  }

  return { prompts: [], relaxedLevel: 0 }
}
