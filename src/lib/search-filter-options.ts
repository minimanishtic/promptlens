import type { Generation } from '@/types/database'
import { KNOWN_PRIMARY_CATEGORIES } from '@/lib/primary-categories'

/** Pill + API — matches browse STATIC_OPTIONS.model */
export const SEARCH_MODEL_OPTIONS = [
  { value: 'text2image_soul_v2', label: 'Soul V2' },
  { value: 'nano_banana_2', label: 'Nano 2' },
  { value: 'nano_banana_flash', label: 'Nano Flash' },
  { value: 'seedream_v4_5', label: 'Seedream 4.5' },
  { value: 'seedream_v5_lite', label: 'Seedream 5 Lite' },
  { value: 'ai_influencer', label: 'AI Influencer' },
  { value: 'flux_2', label: 'Flux 2' },
  { value: 'image_auto', label: 'Image Auto' },
  { value: 'text2keyframes', label: 'Keyframes' },
  { value: 'seedream', label: 'Seedream' },
] as const

export const SEARCH_ASPECT_OPTIONS = [
  { value: '1:1', label: '1:1' },
  { value: '16:9', label: '16:9' },
  { value: '9:16', label: '9:16' },
  { value: '4:5', label: '4:5' },
  { value: '3:4', label: '3:4' },
  { value: '4:3', label: '4:3' },
] as const

export const SEARCH_STYLE_PILL_OPTIONS = [
  { value: 'Photorealistic', label: 'Photorealistic' },
  { value: 'Cinematic', label: 'Cinematic' },
  { value: 'Editorial', label: 'Editorial' },
  { value: 'Vintage/Film', label: 'Vintage / Film' },
  { value: 'Anime/Illustration', label: 'Anime / Illustration' },
  { value: 'Raw/Candid', label: 'Raw / Candid' },
] as const

export const SEARCH_CATEGORY_OPTIONS = KNOWN_PRIMARY_CATEGORIES.map((name) => ({
  value: name,
  label: name,
}))

/** Sidebar — DB `visual_style` values (subset + browse-aligned) */
export const SIDEBAR_VISUAL_STYLE = SEARCH_STYLE_PILL_OPTIONS.map((o) => ({
  value: o.value,
  label: o.label,
}))

export const SIDEBAR_LIGHTING = [
  { value: 'Natural/Golden Hour', label: 'Natural / Golden Hour' },
  { value: 'Studio', label: 'Studio' },
  { value: 'Flash/Harsh', label: 'Flash / Harsh' },
  { value: 'Moody/Low-key', label: 'Moody / Low-key' },
  { value: 'Neon/Colored', label: 'Neon / Colored' },
  { value: 'Backlit', label: 'Backlit' },
] as const

export const SIDEBAR_MOOD = [
  { value: 'Warm', label: 'Warm' },
  { value: 'Cold', label: 'Cold' },
  { value: 'Dramatic', label: 'Dramatic' },
  { value: 'Intimate', label: 'Intimate' },
  { value: 'Energetic', label: 'Energetic' },
  { value: 'Nostalgic', label: 'Nostalgic' },
  { value: 'Dark/Gritty', label: 'Dark / Gritty' },
  { value: 'Clean/Minimal', label: 'Clean / Minimal' },
] as const

export const SIDEBAR_COMPOSITION = [
  { value: 'Close-up', label: 'Close-up' },
  { value: 'Medium Shot', label: 'Medium Shot' },
  { value: 'Full Body', label: 'Full Body' },
  { value: 'Wide/Establishing', label: 'Wide / Establishing' },
  { value: 'Overhead/Flat Lay', label: 'Overhead / Flat Lay' },
  { value: 'POV/First Person', label: 'POV / First Person' },
] as const

export const SIDEBAR_CAMERA = [
  { value: 'DSLR/Mirrorless', label: 'DSLR / Mirrorless' },
  { value: 'Film Camera', label: 'Film / Analog' },
  { value: 'Smartphone/Selfie', label: 'Smartphone / Selfie' },
  { value: 'Drone/Aerial', label: 'Drone / Aerial' },
  { value: 'Vintage Point-and-Shoot', label: 'Vintage camera' },
  { value: 'Security Cam/CCTV', label: 'Security / CCTV' },
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

export function applySearchFilters(
  items: SearchGridItem[],
  pills: SearchPillState,
  sidebar: SearchSidebarState,
): SearchGridItem[] {
  return items.filter((g) => {
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
  })
}

export function countByField(
  items: SearchGridItem[],
  field: keyof Pick<
    Generation,
    'visual_style' | 'lighting' | 'mood' | 'composition' | 'camera_simulation'
  >,
  value: string,
): number {
  return items.filter((g) => g[field] === value).length
}
