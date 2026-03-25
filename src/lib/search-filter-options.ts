import type { Generation } from '@/types/database'
import { MODEL_DISPLAY_NAMES } from '@/types/database'
import { KNOWN_PRIMARY_CATEGORIES } from '@/lib/primary-categories'

/** Extra / friendlier labels for search model pill (overrides `MODEL_DISPLAY_NAMES` when both exist). */
export const SEARCH_MODEL_LABEL_OVERRIDES: Record<string, string> = {
  nano_banana_2: 'Nano Banana 2',
  text2image_soul: 'Soul V1',
  text2image_soul_v2: 'Soul V2',
  nano_flash: 'Nano Flash',
  'flux-pro v1.1': 'Flux Pro v1.1',
  'flux-schnell': 'Flux Schnell',
  flux_schnell: 'Flux Schnell',
  seedream: 'Seedream',
  'seedream_4.5': 'Seedream 4.5',
  seedream_4_5: 'Seedream 4.5',
  seedream_5_lite: 'Seedream 5 Lite',
  seedream_v4_5: 'Seedream 4.5',
  seedream_v5_lite: 'Seedream 5 Lite',
  ai_influencer: 'AI Influencer',
  flux_2: 'Flux 2',
  cinematic_studio_image: 'Cinematic Studio',
  qwen_camera_control: 'Qwen Camera Control',
  kling_omni_image: 'Kling Omni',
  keyframes_faceswap: 'Keyframes Faceswap',
  nano_banana_2_ai_stylist: 'AI Stylist',
  nano_banana_2_relight: 'Nano Relight',
  image_auto: 'Image Auto',
  canvas: 'Canvas',
  canvas_soul: 'Canvas Soul',
  topaz_image: 'Topaz',
  z_image: 'Z Image',
  flux_kontext: 'Flux Kontext',
  reve: 'Reve',
  nano_banana_flash: 'Nano Flash',
  text2keyframes: 'Keyframes',
}

export function getSearchModelLabel(model: string): string {
  return SEARCH_MODEL_LABEL_OVERRIDES[model] ?? MODEL_DISPLAY_NAMES[model] ?? model
}

/** Distinct model values for the pill dropdown (sorted by display label). */
export const SEARCH_MODEL_OPTIONS: { value: string; label: string }[] = (() => {
  const values = new Set<string>([
    ...Object.keys(MODEL_DISPLAY_NAMES),
    ...Object.keys(SEARCH_MODEL_LABEL_OVERRIDES),
  ])
  return Array.from(values)
    .map((value) => ({ value, label: getSearchModelLabel(value) }))
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }))
})()

export const SEARCH_ASPECT_OPTIONS = [
  { value: '1:1', label: '1:1' },
  { value: '16:9', label: '16:9' },
  { value: '9:16', label: '9:16' },
  { value: '4:5', label: '4:5' },
  { value: '3:4', label: '3:4' },
  { value: '4:3', label: '4:3' },
] as const

/** `value` must match `generations.visual_style` exactly (counts + filters). */
export const SEARCH_STYLE_PILL_OPTIONS = [
  { value: 'Photorealistic', label: 'Photorealistic' },
  { value: 'Cinematic', label: 'Cinematic' },
  { value: 'Editorial', label: 'Editorial' },
  { value: 'Vintage/Film', label: 'Vintage / Film' },
  { value: 'Raw/Candid', label: 'Raw / Candid' },
  { value: 'Anime/Illustration', label: 'Anime / Illustration' },
] as const

export const SEARCH_CATEGORY_OPTIONS = KNOWN_PRIMARY_CATEGORIES.map((name) => ({
  value: name,
  label: name,
}))

/** Sidebar — same DB strings as `SEARCH_STYLE_PILL_OPTIONS` */
export const SIDEBAR_VISUAL_STYLE = SEARCH_STYLE_PILL_OPTIONS.map((o) => ({
  value: o.value,
  label: o.label,
}))

/** `value` must match `generations.lighting` exactly */
export const SIDEBAR_LIGHTING = [
  { value: 'Natural/Golden Hour', label: 'Natural / Golden Hour' },
  { value: 'Studio', label: 'Studio' },
  { value: 'Flash/Harsh', label: 'Flash / Harsh' },
  { value: 'Moody/Low-key', label: 'Moody / Low-key' },
  { value: 'Neon/Colored', label: 'Neon / Colored' },
  { value: 'Backlit', label: 'Backlit' },
] as const

/** `value` must match `generations.mood` exactly */
export const SIDEBAR_MOOD = [
  { value: 'Warm', label: 'Warm' },
  { value: 'Cold', label: 'Cold' },
  { value: 'Dramatic', label: 'Dramatic' },
  { value: 'Dark/Gritty', label: 'Dark / Gritty' },
  { value: 'Clean/Minimal', label: 'Clean / Minimal' },
  { value: 'Energetic', label: 'Energetic' },
  { value: 'Nostalgic', label: 'Nostalgic' },
  { value: 'Intimate', label: 'Intimate' },
] as const

/** `value` must match `generations.composition` exactly */
export const SIDEBAR_COMPOSITION = [
  { value: 'Close-up', label: 'Close-up' },
  { value: 'Medium Shot', label: 'Medium Shot' },
  { value: 'Full Body', label: 'Full Body' },
  { value: 'Wide/Establishing', label: 'Wide / Establishing' },
  { value: 'Overhead/Flat Lay', label: 'Overhead / Flat Lay' },
  { value: 'POV/First Person', label: 'POV / First Person' },
] as const

/** `value` must match `generations.camera_simulation` exactly */
export const SIDEBAR_CAMERA = [
  { value: 'DSLR/Mirrorless', label: 'DSLR / Mirrorless' },
  { value: 'Smartphone/Selfie', label: 'Smartphone / Selfie' },
  { value: 'Film Camera', label: 'Film Camera' },
  { value: 'Drone/Aerial', label: 'Drone / Aerial' },
  { value: 'Vintage Point-and-Shoot', label: 'Vintage Point-and-Shoot' },
  { value: 'Security Cam/CCTV', label: 'Security Cam / CCTV' },
] as const

export type SearchPillState = {
  model: string | null
  category: string | null
  aspect_ratio: string | null
  visual_style: string | null
}

export type SearchSidebarState = {
  visual_style: string[]
  lighting: string[]
  mood: string[]
  composition: string[]
  camera_simulation: string[]
}

export const emptyPills: SearchPillState = {
  model: null,
  category: null,
  aspect_ratio: null,
  visual_style: null,
}

export const emptySidebar: SearchSidebarState = {
  visual_style: [],
  lighting: [],
  mood: [],
  composition: [],
  camera_simulation: [],
}

export type SearchGridItem = Generation & { similarity?: number }

/** Single-row check: same rules as Supabase `.eq` / `.in` filters on the search page. */
export function matchesSearchFilters(
  g: Generation,
  pills: SearchPillState,
  sidebar: SearchSidebarState,
): boolean {
  if (pills.model && g.model !== pills.model) return false
  if (pills.category && g.primary_category !== pills.category) return false
  if (pills.aspect_ratio && g.aspect_ratio !== pills.aspect_ratio) return false
  if (pills.visual_style && g.visual_style !== pills.visual_style) return false

  if (sidebar.visual_style.length && (!g.visual_style || !sidebar.visual_style.includes(g.visual_style)))
    return false
  if (sidebar.lighting.length && (!g.lighting || !sidebar.lighting.includes(g.lighting))) return false
  if (sidebar.mood.length && (!g.mood || !sidebar.mood.includes(g.mood))) return false
  if (sidebar.composition.length && (!g.composition || !sidebar.composition.includes(g.composition)))
    return false
  if (
    sidebar.camera_simulation.length &&
    (!g.camera_simulation || !sidebar.camera_simulation.includes(g.camera_simulation))
  )
    return false

  return true
}

/** Apply pill + sidebar constraints to a PostgREST `generations` query builder. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applySearchFiltersToQuery(query: any, pills: SearchPillState, sidebar: SearchSidebarState) {
  let q = query
  if (pills.model) q = q.eq('model', pills.model)
  if (pills.category) q = q.eq('primary_category', pills.category)
  if (pills.aspect_ratio) q = q.eq('aspect_ratio', pills.aspect_ratio)
  if (pills.visual_style) q = q.eq('visual_style', pills.visual_style)
  if (sidebar.visual_style.length) q = q.in('visual_style', sidebar.visual_style)
  if (sidebar.lighting.length) q = q.in('lighting', sidebar.lighting)
  if (sidebar.mood.length) q = q.in('mood', sidebar.mood)
  if (sidebar.composition.length) q = q.in('composition', sidebar.composition)
  if (sidebar.camera_simulation.length) q = q.in('camera_simulation', sidebar.camera_simulation)
  return q
}
