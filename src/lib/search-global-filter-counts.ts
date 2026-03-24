/** Maps from DB classification value → row count (entire `generations` table). */
export type SearchGlobalFilterCounts = {
  visual_style: Record<string, number>
  lighting: Record<string, number>
  mood: Record<string, number>
  composition: Record<string, number>
  camera_simulation: Record<string, number>
}

const EMPTY: SearchGlobalFilterCounts = {
  visual_style: {},
  lighting: {},
  mood: {},
  composition: {},
  camera_simulation: {},
}

function normMap(v: unknown): Record<string, number> {
  if (!v || typeof v !== 'object') return {}
  const out: Record<string, number> = {}
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    const n = typeof val === 'number' ? val : Number(val)
    if (!Number.isNaN(n)) out[k] = n
  }
  return out
}

/** Normalizes `get_filter_counts()` RPC JSON (or API payload). */
export function parseSearchGlobalFilterCounts(raw: unknown): SearchGlobalFilterCounts {
  if (!raw || typeof raw !== 'object') return { ...EMPTY }
  const o = raw as Record<string, unknown>
  return {
    visual_style: normMap(o.visual_style),
    lighting: normMap(o.lighting),
    mood: normMap(o.mood),
    composition: normMap(o.composition),
    camera_simulation: normMap(o.camera_simulation),
  }
}

export function emptySearchGlobalFilterCounts(): SearchGlobalFilterCounts {
  return { ...EMPTY }
}
