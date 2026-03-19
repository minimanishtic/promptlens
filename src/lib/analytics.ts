import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

// ── Types ────────────────────────────────────────────────────────────────────

export interface SummaryStats {
  totalImages: number
  totalWithPrompt: number
  avgViews: number
  topModel: string
  topCategory: string
}

export interface ModelCategoryRow {
  model: string
  primary_category: string
  count: number
}

export interface ModelEngagementRow {
  model: string
  avg_views: number
  count: number
}

export interface PromptLengthBucket {
  bucket: string
  avg_views: number
  count: number
}

export interface VisualStyleRow {
  visual_style: string
  count: number
}

export interface ReferenceImpactRow {
  primary_category: string
  has_references: boolean
  avg_views: number
  count: number
}

export interface HeatmapCell {
  lighting: string
  mood: string
  count: number
}

export interface AnalyticsData {
  summary: SummaryStats
  modelByCategory: ModelCategoryRow[]
  modelEngagement: ModelEngagementRow[]
  promptLengthBuckets: PromptLengthBucket[]
  visualStyleDist: VisualStyleRow[]
  referenceImpact: ReferenceImpactRow[]
  heatmap: HeatmapCell[]
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function bucketLabel(len: number): string {
  if (len < 500) return '0–500'
  if (len < 1000) return '500–1k'
  if (len < 2000) return '1k–2k'
  if (len < 3000) return '2k–3k'
  return '3k+'
}

// ── Fetchers ─────────────────────────────────────────────────────────────────

async function fetchSummary(): Promise<SummaryStats> {
  const [totalRes, promptRes, viewsRes, modelRes, catRes] = await Promise.all([
    supabase.from('generations').select('id', { count: 'exact', head: true }),
    supabase.from('generations').select('id', { count: 'exact', head: true }).eq('has_prompt', true),
    supabase.from('generations').select('views_count').not('views_count', 'is', null),
    supabase.from('generations').select('model, views_count').not('model', 'is', null).not('views_count', 'is', null),
    supabase.from('generations').select('primary_category').not('primary_category', 'is', null),
  ])

  const totalImages = totalRes.count ?? 0
  const totalWithPrompt = promptRes.count ?? 0

  const viewRows = (viewsRes.data ?? []) as { views_count: number }[]
  const avgViews = viewRows.length
    ? Math.round(viewRows.reduce((s, r) => s + r.views_count, 0) / viewRows.length)
    : 0

  // Top model by total views
  const modelTotals: Record<string, number> = {}
  for (const r of (modelRes.data ?? []) as { model: string; views_count: number }[]) {
    if (r.model) modelTotals[r.model] = (modelTotals[r.model] ?? 0) + r.views_count
  }
  const topModel = Object.entries(modelTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'

  // Top category by count
  const catCounts: Record<string, number> = {}
  for (const r of (catRes.data ?? []) as { primary_category: string }[]) {
    if (r.primary_category) catCounts[r.primary_category] = (catCounts[r.primary_category] ?? 0) + 1
  }
  const topCategory = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'

  return { totalImages, totalWithPrompt, avgViews, topModel, topCategory }
}

async function fetchModelByCategory(): Promise<ModelCategoryRow[]> {
  const { data } = await supabase
    .from('generations')
    .select('model, primary_category')
    .not('model', 'is', null)
    .not('primary_category', 'is', null)

  const counts: Record<string, number> = {}
  for (const r of (data ?? []) as { model: string; primary_category: string }[]) {
    const key = `${r.model}|||${r.primary_category}`
    counts[key] = (counts[key] ?? 0) + 1
  }

  return Object.entries(counts).map(([key, count]) => {
    const [model, primary_category] = key.split('|||')
    return { model, primary_category, count }
  })
}

async function fetchModelEngagement(): Promise<ModelEngagementRow[]> {
  const { data } = await supabase
    .from('generations')
    .select('model, views_count')
    .not('model', 'is', null)
    .not('views_count', 'is', null)

  const agg: Record<string, { total: number; count: number }> = {}
  for (const r of (data ?? []) as { model: string; views_count: number }[]) {
    if (!agg[r.model]) agg[r.model] = { total: 0, count: 0 }
    agg[r.model].total += r.views_count
    agg[r.model].count += 1
  }

  return Object.entries(agg)
    .map(([model, { total, count }]) => ({
      model,
      avg_views: Math.round(total / count),
      count,
    }))
    .sort((a, b) => b.avg_views - a.avg_views)
}

async function fetchPromptLengthBuckets(): Promise<PromptLengthBucket[]> {
  const { data } = await supabase
    .from('generations')
    .select('prompt_length, views_count')
    .not('prompt_length', 'is', null)
    .not('views_count', 'is', null)
    .gt('prompt_length', 0)

  const agg: Record<string, { total: number; count: number }> = {}
  const ORDER = ['0–500', '500–1k', '1k–2k', '2k–3k', '3k+']

  for (const r of (data ?? []) as { prompt_length: number; views_count: number }[]) {
    const bucket = bucketLabel(r.prompt_length)
    if (!agg[bucket]) agg[bucket] = { total: 0, count: 0 }
    agg[bucket].total += r.views_count
    agg[bucket].count += 1
  }

  return ORDER.filter((b) => agg[b]).map((bucket) => ({
    bucket,
    avg_views: Math.round(agg[bucket].total / agg[bucket].count),
    count: agg[bucket].count,
  }))
}

async function fetchVisualStyleDist(): Promise<VisualStyleRow[]> {
  const { data } = await supabase
    .from('generations')
    .select('visual_style')
    .not('visual_style', 'is', null)

  const counts: Record<string, number> = {}
  for (const r of (data ?? []) as { visual_style: string }[]) {
    if (r.visual_style) counts[r.visual_style] = (counts[r.visual_style] ?? 0) + 1
  }

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([visual_style, count]) => ({ visual_style, count }))
}

async function fetchReferenceImpact(): Promise<ReferenceImpactRow[]> {
  const { data } = await supabase
    .from('generations')
    .select('primary_category, has_references, views_count')
    .not('primary_category', 'is', null)
    .not('has_references', 'is', null)
    .not('views_count', 'is', null)

  const agg: Record<string, { total: number; count: number }> = {}
  for (const r of (data ?? []) as { primary_category: string; has_references: boolean; views_count: number }[]) {
    const key = `${r.primary_category}|||${r.has_references}`
    if (!agg[key]) agg[key] = { total: 0, count: 0 }
    agg[key].total += r.views_count
    agg[key].count += 1
  }

  return Object.entries(agg).map(([key, { total, count }]) => {
    const [primary_category, hasRef] = key.split('|||')
    return {
      primary_category,
      has_references: hasRef === 'true',
      avg_views: Math.round(total / count),
      count,
    }
  })
}

async function fetchHeatmap(): Promise<HeatmapCell[]> {
  const { data } = await supabase
    .from('generations')
    .select('lighting, mood')
    .not('lighting', 'is', null)
    .not('mood', 'is', null)

  const counts: Record<string, number> = {}
  for (const r of (data ?? []) as { lighting: string; mood: string }[]) {
    if (r.lighting && r.mood) {
      const key = `${r.lighting}|||${r.mood}`
      counts[key] = (counts[key] ?? 0) + 1
    }
  }

  return Object.entries(counts).map(([key, count]) => {
    const [lighting, mood] = key.split('|||')
    return { lighting, mood, count }
  })
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function fetchAllAnalytics(): Promise<AnalyticsData> {
  const [summary, modelByCategory, modelEngagement, promptLengthBuckets, visualStyleDist, referenceImpact, heatmap] =
    await Promise.all([
      fetchSummary(),
      fetchModelByCategory(),
      fetchModelEngagement(),
      fetchPromptLengthBuckets(),
      fetchVisualStyleDist(),
      fetchReferenceImpact(),
      fetchHeatmap(),
    ])

  return { summary, modelByCategory, modelEngagement, promptLengthBuckets, visualStyleDist, referenceImpact, heatmap }
}
