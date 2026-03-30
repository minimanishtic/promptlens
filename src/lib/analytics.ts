import { createClient } from '@/lib/supabase-client'
import type { SearchPillState, SearchSidebarState } from '@/lib/search-filter-options'

function getSessionId(): string {
  if (typeof window === 'undefined') return 'server'
  let id = localStorage.getItem('promere_session_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('promere_session_id', id)
  }
  return id
}

async function getUserId(): Promise<string | null> {
  try {
    const supabase = createClient()
    const { data } = await supabase.auth.getSession()
    return data.session?.user?.id ?? null
  } catch {
    return null
  }
}

/** Flatten pill + sidebar state for analytics (string values only). */
export function serializeSearchFiltersForLog(
  pills: SearchPillState,
  sidebar: SearchSidebarState,
): Record<string, string> {
  const f: Record<string, string> = {}
  if (pills.model) f.model = pills.model
  if (pills.category) f.category = pills.category
  if (pills.aspect_ratio) f.aspect_ratio = pills.aspect_ratio
  if (pills.visual_style) f.visual_style = pills.visual_style
  if (sidebar.visual_style.length) f.sidebar_visual_style = sidebar.visual_style.join(',')
  if (sidebar.lighting.length) f.sidebar_lighting = sidebar.lighting.join(',')
  if (sidebar.mood.length) f.sidebar_mood = sidebar.mood.join(',')
  if (sidebar.composition.length) f.sidebar_composition = sidebar.composition.join(',')
  if (sidebar.camera_simulation.length) f.sidebar_camera_simulation = sidebar.camera_simulation.join(',')
  return f
}

export async function logSearch(params: {
  query: string
  search_type: 'semantic' | 'fulltext' | 'filter'
  results_count: number
  filters_used?: Record<string, string>
}) {
  try {
    const supabase = createClient()
    // Tables may exist before generated Database types are updated
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    await db.from('search_queries').insert({
      query: params.query,
      search_type: params.search_type,
      results_count: params.results_count,
      filters_used: params.filters_used ?? {},
      user_id: await getUserId(),
      session_id: getSessionId(),
    })
  } catch {
    /* silent */
  }
}

export async function logEvent(
  event_type: string,
  event_data: Record<string, unknown> = {},
  page?: string,
) {
  try {
    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    await db.from('analytics_events').insert({
      event_type,
      event_data,
      page: page ?? (typeof window !== 'undefined' ? window.location.pathname : undefined),
      user_id: await getUserId(),
      session_id: getSessionId(),
    })
  } catch {
    /* silent */
  }
}
