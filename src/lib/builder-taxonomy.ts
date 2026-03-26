/** Exact DB `primary_category` / taxonomy values for the prompt builder wizard. */

export const BUILDER_CATEGORIES = [
  {
    value: 'Portrait & Headshot',
    label: 'Portrait & Headshot',
    description: 'Studio portraits, headshots, selfies, character studies',
    count: 1966,
  },
  {
    value: 'Fashion & Editorial',
    label: 'Fashion & Editorial',
    description: 'Fashion shoots, editorial campaigns, styling, lookbooks',
    count: 1311,
  },
  {
    value: 'Street & Documentary',
    label: 'Street & Documentary',
    description: 'Street photography, candid moments, urban scenes, reportage',
    count: 1085,
  },
  {
    value: 'Fantasy & Creative',
    label: 'Fantasy & Creative',
    description: 'Surreal, sci-fi, mythology, abstract, creative composites',
    count: 906,
  },
  {
    value: 'Cinematic & Film Still',
    label: 'Cinematic & Film Still',
    description: 'Movie-grade compositions, narrative scenes, dramatic framing',
    count: 674,
  },
  {
    value: 'Product Photography',
    label: 'Product Photography',
    description: 'Product shots, food photography, flat lays, commercial stills',
    count: 471,
  },
  {
    value: 'Landscape & Architecture',
    label: 'Landscape & Architecture',
    description: 'Landscapes, cityscapes, buildings, interiors, aerial views',
    count: 372,
  },
  {
    value: 'Identity Transform',
    label: 'Identity Transform',
    description: 'Style transfers, age transforms, character changes',
    count: 20,
  },
] as const

export const BUILDER_VISUAL_STYLES = [
  {
    value: 'Photorealistic',
    label: 'Photorealistic',
    description: 'Sharp, accurate, indistinguishable from a real photograph',
  },
  {
    value: 'Cinematic',
    label: 'Cinematic',
    description: 'Movie-frame depth, dramatic composition, film-grade color',
  },
  {
    value: 'Editorial',
    label: 'Editorial',
    description: 'Magazine-quality, polished and intentional styling',
  },
  {
    value: 'Vintage/Film',
    label: 'Vintage / Film',
    description: 'Film grain, muted tones, analog warmth and character',
  },
  {
    value: 'Raw/Candid',
    label: 'Raw / Candid',
    description: 'Unposed, authentic, documentary feel',
  },
  {
    value: 'Anime/Illustration',
    label: 'Anime / Illustration',
    description: 'Stylised, drawn or painted aesthetic',
  },
] as const

export const BUILDER_LIGHTING = [
  {
    value: 'Natural/Golden Hour',
    label: 'Natural / Golden Hour',
    description: 'Warm sunlight, soft shadows, organic feel',
  },
  {
    value: 'Studio',
    label: 'Studio',
    description: 'Controlled, clean, professional lighting setup',
  },
  {
    value: 'Moody/Low-key',
    label: 'Moody / Low-key',
    description: 'Deep shadows, minimal fill, dramatic contrast',
  },
  {
    value: 'Neon/Colored',
    label: 'Neon / Colored',
    description: 'Colored gels, neon signs, artificial color ambiance',
  },
  {
    value: 'Flash/Harsh',
    label: 'Flash / Harsh',
    description: 'High contrast, direct flash, sharp shadows',
  },
  {
    value: 'Backlit',
    label: 'Backlit',
    description: 'Light behind subject, rim glow, silhouette potential',
  },
] as const

export const BUILDER_MOODS = [
  { value: 'Warm', label: 'Warm', description: 'Golden tones, inviting atmosphere, comfort' },
  { value: 'Dramatic', label: 'Dramatic', description: 'High contrast, emotional tension, powerful' },
  {
    value: 'Clean/Minimal',
    label: 'Clean / Minimal',
    description: 'Sparse, airy, refined, uncluttered',
  },
  {
    value: 'Dark/Gritty',
    label: 'Dark / Gritty',
    description: 'Raw, urban, textured, moody edges',
  },
  {
    value: 'Energetic',
    label: 'Energetic',
    description: 'Dynamic, vibrant, movement and life',
  },
  {
    value: 'Intimate',
    label: 'Intimate',
    description: 'Close, personal, quiet emotional weight',
  },
  {
    value: 'Nostalgic',
    label: 'Nostalgic',
    description: 'Soft and memory-like, wistful, timeless',
  },
  { value: 'Cold', label: 'Cold', description: 'Blue-white palette, distant feel, stark' },
] as const

export const BUILDER_COMPOSITIONS = [
  {
    value: 'Medium Shot',
    label: 'Medium Shot',
    description: 'Waist up, balanced framing, versatile',
  },
  {
    value: 'Full Body',
    label: 'Full Body',
    description: 'Head to toe, environment context, fashion-forward',
  },
  {
    value: 'Close-up',
    label: 'Close-up',
    description: 'Tight on face or detail, emotional intensity',
  },
  {
    value: 'Wide/Establishing',
    label: 'Wide / Establishing',
    description: 'Broad scene, sense of place, environmental',
  },
  {
    value: 'Overhead/Flat Lay',
    label: 'Overhead / Flat Lay',
    description: "Bird's-eye view, graphic layout, product display",
  },
  {
    value: 'POV/First Person',
    label: 'POV / First Person',
    description: "Through the subject's eyes, immersive perspective",
  },
] as const

export const STEP_EXPLAINERS = {
  category:
    'Start broad. What type of image are you creating? This narrows 6,800+ prompts to your domain.',
  visual_style:
    'How should it feel visually? This determines the overall rendering approach and aesthetic.',
  lighting: 'Lighting shapes mood more than any other setting. Pick what matches your scene.',
  mood: 'The emotional tone of the image. This affects color grading, contrast, and atmosphere.',
  composition: 'How is the subject framed? This controls camera distance and angle.',
  model: "Different AI models have different strengths. We'll show you the best results for each.",
} as const

export type BuilderStepName = keyof typeof STEP_EXPLAINERS

const LABEL_BY_STEP: Record<BuilderStepName, ReadonlyArray<{ value: string; label: string }>> = {
  category: BUILDER_CATEGORIES,
  visual_style: BUILDER_VISUAL_STYLES,
  lighting: BUILDER_LIGHTING,
  mood: BUILDER_MOODS,
  composition: BUILDER_COMPOSITIONS,
  model: [],
}

/** Breadcrumb / UI label for a stored DB value (not for model — use getModelDisplayName). */
export function builderTaxonomyLabel(step: BuilderStepName, value: string): string {
  const list = LABEL_BY_STEP[step]
  const hit = list.find((o) => o.value === value)
  return hit?.label ?? value
}
