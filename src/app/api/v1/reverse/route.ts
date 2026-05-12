import { NextRequest, NextResponse } from 'next/server'
import { normalizeReversePayload } from '@/lib/prompt-formatters'
import {
  withApiAuth,
  apiError,
  corsPreflight,
  withCors,
} from '@/lib/api-middleware'

const ENDPOINT = '/api/v1/reverse'

const SYSTEM_PROMPT = `You are an expert AI image prompt engineer. Given an image, you reverse-engineer it into structured prompt elements.

Return ONLY a JSON object with no markdown, no backticks, no explanation:
{
  "elements": {
    "subject": "Detailed description of the main subject — who/what they are, appearance, clothing, features, materials. 2-3 sentences.",
    "action_pose": "What the subject is doing, their pose, gesture, expression, body language. 1-2 sentences.",
    "setting": "The environment, location, background, time of day, weather, surroundings. 1-2 sentences.",
    "lighting": "Specific lighting description — direction, quality, color temperature, shadows, highlights. 1-2 sentences.",
    "composition": "Camera angle, framing, depth of field, focal length, perspective, aspect ratio. 1-2 sentences.",
    "style": "Art style, visual aesthetic, rendering approach, artistic references. 1-2 sentences.",
    "mood": "Emotional tone, atmosphere, feeling, energy of the image. 1 sentence.",
    "technical": "Camera/lens specs if photorealistic, render engine if 3D, resolution quality notes. 1 sentence."
  },
  "negative_prompt": "Things to avoid: common artifacts, unwanted elements. Comma-separated list.",
  "category": "one of: Portrait & Headshot, Fashion & Editorial, Product Photography, Cinematic & Film Still, Street & Documentary, Fantasy & Creative, Landscape & Architecture, Identity Transform, Anime & Illustration, Abstract & Artistic",
  "color_palette": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"]
}

RULES:
- Each element should be descriptive and specific, not vague
- Use concrete visual language, not abstract concepts
- Include real camera/lens names where appropriate (e.g., "85mm f/1.8", "Hasselblad X2D")
- color_palette should be 5 dominant colors extracted from the image as hex codes
- Write elements as standalone phrases/sentences, NOT as a combined prompt`

const VALID_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
type ImageMediaType = (typeof VALID_TYPES)[number]
const MAX_BYTES = 10 * 1024 * 1024
const URL_FETCH_TIMEOUT_MS = 5000

function normalizeMediaType(raw: string | null | undefined): ImageMediaType | null {
  if (!raw) return null
  // Strip parameters like "image/jpeg; charset=binary".
  const base = raw.split(';')[0].trim().toLowerCase()
  if (base === 'image/jpg') return 'image/jpeg'
  if ((VALID_TYPES as readonly string[]).includes(base)) return base as ImageMediaType
  return null
}

interface ImagePayload {
  buffer: Buffer
  mediaType: ImageMediaType
}

async function loadFromMultipart(req: NextRequest): Promise<ImagePayload | NextResponse> {
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return apiError(
      'bad_request',
      'Expected multipart/form-data with an "image" file field',
      400,
    )
  }
  const file = formData.get('image')
  if (!file || !(file instanceof File)) {
    return apiError('bad_request', 'No image provided. Send as form field "image".', 400)
  }
  const mediaType = normalizeMediaType(file.type)
  if (!mediaType) {
    return apiError(
      'bad_request',
      'Invalid file type. Use image/jpeg, image/png, or image/webp.',
      400,
    )
  }
  if (file.size > MAX_BYTES) {
    return apiError('bad_request', 'Image too large. Max 10MB.', 400)
  }
  const buffer = Buffer.from(await file.arrayBuffer())
  return { buffer, mediaType }
}

async function loadFromUrl(req: NextRequest): Promise<ImagePayload | NextResponse> {
  let body: { image_url?: unknown }
  try {
    body = (await req.json()) as { image_url?: unknown }
  } catch {
    return apiError('bad_request', 'Request body must be valid JSON', 400)
  }
  const imageUrl = body.image_url
  if (typeof imageUrl !== 'string' || !imageUrl) {
    return apiError('bad_request', 'image_url is required', 400)
  }
  let parsedUrl: URL
  try {
    parsedUrl = new URL(imageUrl)
  } catch {
    return apiError('bad_request', 'Invalid URL format', 400)
  }
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    return apiError('bad_request', 'Only HTTP/HTTPS URLs are supported', 400)
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), URL_FETCH_TIMEOUT_MS)
  try {
    const imgRes = await fetch(parsedUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Promere/1.0 (+https://www.promere.app)' },
      redirect: 'follow',
    })
    clearTimeout(timeout)

    if (!imgRes.ok) {
      return apiError('bad_request', `Failed to fetch image: HTTP ${imgRes.status}`, 400)
    }

    const declaredLength = imgRes.headers.get('content-length')
    if (declaredLength) {
      const n = Number.parseInt(declaredLength, 10)
      if (Number.isFinite(n) && n > MAX_BYTES) {
        return apiError('bad_request', 'Image exceeds 10MB limit', 400)
      }
    }

    const mediaType = normalizeMediaType(imgRes.headers.get('content-type'))
    if (!mediaType) {
      return apiError(
        'bad_request',
        'URL does not point to a supported image (image/jpeg, image/png, image/webp).',
        400,
      )
    }

    const buf = Buffer.from(await imgRes.arrayBuffer())
    if (buf.byteLength > MAX_BYTES) {
      return apiError('bad_request', 'Image exceeds 10MB limit', 400)
    }
    return { buffer: buf, mediaType }
  } catch (err) {
    clearTimeout(timeout)
    if (err instanceof Error && err.name === 'AbortError') {
      return apiError('bad_request', 'Image fetch timed out (5s limit)', 408)
    }
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return apiError('bad_request', `Failed to fetch image: ${msg}`, 400)
  }
}

async function reverseHandler(req: NextRequest): Promise<NextResponse> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicKey || anthropicKey.trim() === '') {
    return apiError('internal_error', 'Image analysis service unavailable', 503)
  }

  const contentType = req.headers.get('content-type') || ''
  let imagePayload: ImagePayload
  if (contentType.includes('application/json')) {
    const result = await loadFromUrl(req)
    if (result instanceof NextResponse) return result
    imagePayload = result
  } else if (contentType.includes('multipart/form-data')) {
    const result = await loadFromMultipart(req)
    if (result instanceof NextResponse) return result
    imagePayload = result
  } else {
    return apiError(
      'bad_request',
      'Content-Type must be application/json (with image_url) or multipart/form-data (with image file).',
      400,
    )
  }

  const base64 = imagePayload.buffer.toString('base64')
  const mediaType = imagePayload.mediaType

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': anthropicKey,
      'content-type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
            { type: 'text', text: 'Reverse-engineer this image into structured prompt elements.' },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    console.error('[/api/v1/reverse] Anthropic error:', response.status, errText)
    return apiError('analysis_failed', 'Failed to analyze image. Try again.', 502)
  }

  const data = (await response.json()) as { content?: Array<{ type: string; text?: string }> }
  const block = data.content?.find((c) => c.type === 'text')
  const text = block?.text?.trim() ?? ''

  let parsed: unknown
  try {
    let clean = text
    if (clean.startsWith('```')) {
      clean = clean.split('\n').slice(1).join('\n')
      if (clean.endsWith('```')) clean = clean.slice(0, -3)
      clean = clean.trim()
    }
    parsed = JSON.parse(clean)
  } catch {
    return apiError('analysis_failed', 'Failed to parse analysis response. Try again.', 500)
  }

  const normalized = normalizeReversePayload(parsed)
  if (!normalized) {
    return apiError('analysis_failed', 'Invalid analysis response. Try again.', 500)
  }

  return NextResponse.json(normalized)
}

export const POST = withApiAuth(ENDPOINT, reverseHandler)

export function OPTIONS(): NextResponse {
  return corsPreflight()
}

export function GET(): NextResponse {
  return withCors(
    NextResponse.json(
      { error: { code: 'method_not_allowed', message: 'Use POST with multipart/form-data' } },
      { status: 405 },
    ),
  )
}
