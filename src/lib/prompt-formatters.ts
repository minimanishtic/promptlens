export interface PromptElements {
  subject: string
  action_pose: string
  setting: string
  lighting: string
  composition: string
  style: string
  mood: string
  technical: string
}

export interface ReverseResult {
  elements: PromptElements
  negative_prompt: string
  category: string
  color_palette: string[]
}

export type ModelId =
  | 'flux'
  | 'nano-banana-pro'
  | 'nano-banana-2'
  | 'seedream-4.5'
  | 'seedream-5-lite'
  | 'grok'
  | 'midjourney'
  | 'stable-diffusion'
  | 'dall-e'
  | 'ideogram'

export interface ModelInfo {
  id: ModelId
  name: string
  family: string
  description: string
  promptStyle: string
  supportsNegative: boolean
  idealLength: string
}

export const MODELS: ModelInfo[] = [
  {
    id: 'flux',
    name: 'Flux',
    family: 'Black Forest Labs',
    description: 'Best for photorealism & text rendering',
    promptStyle: 'Natural language prose',
    supportsNegative: false,
    idealLength: '50–80 words',
  },
  {
    id: 'nano-banana-pro',
    name: 'Nano Banana Pro',
    family: 'Google (Gemini 3)',
    description: 'Reasoning-powered, text & infographics',
    promptStyle: 'Structured natural language',
    supportsNegative: false,
    idealLength: '40–100 words',
  },
  {
    id: 'nano-banana-2',
    name: 'Nano Banana 2',
    family: 'Google (Gemini 3.1)',
    description: 'Fast generation, web-grounded',
    promptStyle: 'Concise descriptive',
    supportsNegative: false,
    idealLength: '30–60 words',
  },
  {
    id: 'seedream-4.5',
    name: 'Seedream 4.5',
    family: 'ByteDance',
    description: '4K native, strong typography',
    promptStyle: 'Subject-first, concise',
    supportsNegative: true,
    idealLength: '30–100 words',
  },
  {
    id: 'seedream-5-lite',
    name: 'Seedream 5 Lite',
    family: 'ByteDance',
    description: 'Fast, lightweight Seedream',
    promptStyle: 'Concise natural language',
    supportsNegative: true,
    idealLength: '30–80 words',
  },
  {
    id: 'grok',
    name: 'Grok / Aurora',
    family: 'xAI',
    description: 'Rich photorealism, sensory detail',
    promptStyle: 'Descriptive prose, mood-forward',
    supportsNegative: false,
    idealLength: '60–150 words',
  },
  {
    id: 'midjourney',
    name: 'Midjourney',
    family: 'Midjourney',
    description: 'Artistic, stylized imagery',
    promptStyle: 'Short phrases + parameter flags',
    supportsNegative: true,
    idealLength: '20–60 words',
  },
  {
    id: 'stable-diffusion',
    name: 'Stable Diffusion',
    family: 'Stability AI',
    description: 'Open-source, highly customizable',
    promptStyle: 'Comma-separated tags + weights',
    supportsNegative: true,
    idealLength: '30–80 tokens',
  },
  {
    id: 'dall-e',
    name: 'DALL-E / GPT Image',
    family: 'OpenAI',
    description: 'Conversational, creative direction',
    promptStyle: 'Paragraph creative brief',
    supportsNegative: false,
    idealLength: '50–120 words',
  },
  {
    id: 'ideogram',
    name: 'Ideogram',
    family: 'Ideogram',
    description: 'Best-in-class text in images',
    promptStyle: 'Natural language, text in quotes',
    supportsNegative: false,
    idealLength: '30–80 words',
  },
]

/** Normalize API JSON into ReverseResult; returns null if unusable. */
export function normalizeReversePayload(parsed: unknown): ReverseResult | null {
  if (!parsed || typeof parsed !== 'object') return null
  const o = parsed as Record<string, unknown>
  const rawEl = o.elements
  if (!rawEl || typeof rawEl !== 'object') return null
  const e = rawEl as Record<string, unknown>
  const elements: PromptElements = {
    subject: String(e.subject ?? ''),
    action_pose: String(e.action_pose ?? ''),
    setting: String(e.setting ?? ''),
    lighting: String(e.lighting ?? ''),
    composition: String(e.composition ?? ''),
    style: String(e.style ?? ''),
    mood: String(e.mood ?? ''),
    technical: String(e.technical ?? ''),
  }
  const hasAny = Object.values(elements).some((v) => v.trim().length > 0)
  if (!hasAny) return null

  const color_palette = Array.isArray(o.color_palette)
    ? o.color_palette.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    : []

  return {
    elements,
    negative_prompt: typeof o.negative_prompt === 'string' ? o.negative_prompt : '',
    category: typeof o.category === 'string' ? o.category : '',
    color_palette,
  }
}

export function formatForModel(modelId: ModelId, elements: PromptElements): string {
  switch (modelId) {
    case 'flux':
      return formatFlux(elements)
    case 'nano-banana-pro':
      return formatNanoBananaPro(elements)
    case 'nano-banana-2':
      return formatNanoBanana2(elements)
    case 'seedream-4.5':
    case 'seedream-5-lite':
      return formatSeedream(elements)
    case 'grok':
      return formatGrok(elements)
    case 'midjourney':
      return formatMidjourney(elements)
    case 'stable-diffusion':
      return formatStableDiffusion(elements)
    case 'dall-e':
      return formatDallE(elements)
    case 'ideogram':
      return formatIdeogram(elements)
    default:
      return formatFlux(elements)
  }
}

function formatFlux(e: PromptElements): string {
  return `${e.subject} ${e.action_pose} ${e.setting} ${e.lighting} ${e.composition} ${e.style} ${e.mood} ${e.technical}`
    .replace(/\s+/g, ' ')
    .trim()
}

function formatNanoBananaPro(e: PromptElements): string {
  return [
    `${e.subject} ${e.action_pose}`.trim(),
    e.setting,
    e.composition,
    e.lighting,
    `${e.style} ${e.mood}`.trim(),
    e.technical,
  ]
    .filter(Boolean)
    .join('. ')
    .replace(/\.\./g, '.')
    .replace(/\s+/g, ' ')
    .trim()
}

function formatNanoBanana2(e: PromptElements): string {
  const shorten = (s: string) => s.split('.')[0]?.trim() ?? ''
  return [
    shorten(e.subject),
    shorten(e.action_pose),
    shorten(e.setting),
    shorten(e.lighting),
    shorten(e.composition),
    shorten(e.style),
  ]
    .filter((s) => s.length > 0)
    .join(', ')
    .replace(/\s+/g, ' ')
    .trim()
}

function formatSeedream(e: PromptElements): string {
  return [
    `${e.subject} ${e.action_pose}`.trim(),
    e.style,
    e.composition,
    e.lighting,
    e.setting,
    e.mood,
    e.technical,
  ]
    .filter(Boolean)
    .join('. ')
    .replace(/\.\./g, '.')
    .replace(/\s+/g, ' ')
    .trim()
}

function formatGrok(e: PromptElements): string {
  const mood = e.mood?.trim()
    ? `The atmosphere is ${e.mood.toLowerCase().replace(/\.$/, '')}. `
    : ''
  return `${e.subject} ${e.action_pose} ${e.setting} ${mood}${e.lighting} ${e.composition} ${e.style} ${e.technical}`
    .replace(/\s+/g, ' ')
    .trim()
}

function formatMidjourney(e: PromptElements): string {
  const shorten = (s: string) => s.split('.')[0]?.trim() ?? ''
  const core = [
    shorten(e.subject),
    shorten(e.action_pose),
    shorten(e.setting),
    shorten(e.lighting),
    shorten(e.style),
    shorten(e.mood),
  ]
    .filter((s) => s.length > 0)
    .join(', ')
  return `${core} --ar 16:9 --v 7 --s 500`.trim()
}

function formatStableDiffusion(e: PromptElements): string {
  const shorten = (s: string) => s.split('.')[0]?.trim() ?? ''
  const tags = [
    shorten(e.subject),
    shorten(e.action_pose),
    shorten(e.setting),
    shorten(e.lighting),
    shorten(e.style),
    shorten(e.mood),
    shorten(e.composition),
  ]
    .filter((s) => s.length > 0)
    .join(', ')
  return `${tags}, masterpiece, best quality, highly detailed`.replace(/^, /, '').trim()
}

function formatDallE(e: PromptElements): string {
  const lower = (s: string) => s.toLowerCase().replace(/\.$/, '')
  return `Create an image of ${lower(e.subject)} ${lower(e.action_pose)} The scene takes place in ${lower(e.setting)} with ${lower(e.lighting)} The image should feel ${lower(e.mood)} and be composed as ${lower(e.composition)} in a ${lower(e.style)} ${e.technical}`
    .replace(/\s+/g, ' ')
    .trim()
}

function formatIdeogram(e: PromptElements): string {
  return `${e.subject} ${e.action_pose} ${e.setting} ${e.lighting} ${e.style}, ${e.mood} ${e.composition}`.replace(/\s+/g, ' ').trim()
}
