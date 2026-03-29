import { createClient } from '@supabase/supabase-js'
import type { Database, Generation } from '@/types/database'
import { GENERATION_GRID_SELECT } from '@/lib/generation-grid-select'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

export const CATEGORIES = [
  'Portrait & Headshot',
  'Fashion & Style',
  'Landscape & Nature',
  'Architecture & Interior',
  'Product & Commercial',
  'Abstract & Artistic',
  'Sports & Action',
  'Food & Lifestyle',
]

export interface CategoryTemplates {
  category: string
  templates: Generation[]
}

export async function fetchTemplates(filterModel?: string): Promise<{
  byCategory: CategoryTemplates[]
  allModels: string[]
}> {
  // Build query — fetch top 5 per category for all 8 categories in one shot
  let query = supabase
    .from('generations')
    .select(GENERATION_GRID_SELECT)
    .in('primary_category', CATEGORIES)
    .eq('has_prompt', true)
    .not('output_image_url', 'is', null)
    .not('prompt', 'is', null)
    .order('sort_priority', { ascending: true })
    .order('views_count', { ascending: false })

  if (filterModel) {
    query = query.eq('model', filterModel)
  }

  // Fetch more than we need so we can pick top-5 per category
  const { data, error } = await query.limit(500)

  if (error) throw error

  const rows = (data ?? []) as Generation[]

  // Collect distinct models for the filter UI
  const modelSet = new Set<string>()
  for (const r of rows) {
    if (r.model) modelSet.add(r.model)
  }

  // Group into top-5 per category, preserving views_count order
  const grouped = new Map<string, Generation[]>()
  for (const cat of CATEGORIES) {
    grouped.set(cat, [])
  }
  for (const row of rows) {
    const cat = row.primary_category!
    const bucket = grouped.get(cat)
    if (bucket && bucket.length < 5) bucket.push(row)
  }

  const byCategory: CategoryTemplates[] = CATEGORIES.map((cat) => ({
    category: cat,
    templates: grouped.get(cat) ?? [],
  })).filter((c) => c.templates.length > 0)

  return { byCategory, allModels: [...modelSet].sort() }
}
