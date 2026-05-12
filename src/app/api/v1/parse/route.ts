import { NextRequest, NextResponse } from 'next/server'
import {
  withApiAuth,
  apiError,
  corsPreflight,
  withCors,
} from '@/lib/api-middleware'

const ENDPOINT = '/api/v1/parse'

const SYSTEM_PROMPT = `You are a prompt analyst. Given an AI image generation prompt, extract it into these 8 structured elements. Return JSON only, no markdown.

Elements:
- subject: The main subject being depicted
- action_pose: Action or pose of the subject (null if not applicable)
- setting: Background, environment, location
- lighting: Lighting setup and direction
- composition: Framing, camera angle, shot type
- style: Visual style, artistic style, rendering style
- mood: Emotional tone, atmosphere
- technical: Camera settings, resolution, technical parameters

Also extract:
- negative_prompt: Any negative prompt if present (null if none)
- category: Best fitting category from: Portrait & Headshot, Fashion & Editorial, Street & Documentary, Fantasy & Creative, Cinematic & Film Still, Product Photography, Landscape & Architecture, Identity Transform

If any element is not present or cannot be determined, set it to null.
Return ONLY valid JSON, no other text.`

const MAX_INPUT_LEN = 4000

type Nullable = string | null

interface ParsedElements {
  subject: Nullable
  action_pose: Nullable
  setting: Nullable
  lighting: Nullable
  composition: Nullable
  style: Nullable
  mood: Nullable
  technical: Nullable
}

interface ParseResponse {
  elements: ParsedElements
  negative_prompt: Nullable
  category: Nullable
}

function asNullable(v: unknown): Nullable {
  if (typeof v !== 'string') return null
  const trimmed = v.trim()
  if (!trimmed || trimmed.toLowerCase() === 'null') return null
  return trimmed
}

function normalizeParsed(parsed: unknown): ParseResponse | null {
  if (!parsed || typeof parsed !== 'object') return null
  const o = parsed as Record<string, unknown>
  const e = (o.elements && typeof o.elements === 'object' ? o.elements : {}) as Record<string, unknown>
  const elements: ParsedElements = {
    subject: asNullable(e.subject),
    action_pose: asNullable(e.action_pose),
    setting: asNullable(e.setting),
    lighting: asNullable(e.lighting),
    composition: asNullable(e.composition),
    style: asNullable(e.style),
    mood: asNullable(e.mood),
    technical: asNullable(e.technical),
  }
  const hasAny = Object.values(elements).some((v) => v !== null)
  if (!hasAny) return null
  return {
    elements,
    negative_prompt: asNullable(o.negative_prompt),
    category: asNullable(o.category),
  }
}

async function parseHandler(req: NextRequest): Promise<NextResponse> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicKey || anthropicKey.trim() === '') {
    return apiError('internal_error', 'Parse service unavailable', 503)
  }

  let body: { text?: unknown }
  try {
    body = (await req.json()) as { text?: unknown }
  } catch {
    return apiError('bad_request', 'Request body must be valid JSON', 400)
  }

  const text = typeof body.text === 'string' ? body.text.trim() : ''
  if (!text) {
    return apiError('bad_request', 'text is required', 400)
  }
  if (text.length > MAX_INPUT_LEN) {
    return apiError('bad_request', `text exceeds ${MAX_INPUT_LEN} characters`, 400)
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': anthropicKey,
      'content-type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Parse this prompt:\n\n${text}`,
        },
      ],
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    console.error('[/api/v1/parse] Anthropic error:', response.status, errText)
    return apiError('analysis_failed', 'Failed to parse prompt. Try again.', 502)
  }

  const data = (await response.json()) as { content?: Array<{ type: string; text?: string }> }
  const block = data.content?.find((c) => c.type === 'text')
  const raw = block?.text?.trim() ?? ''

  let parsed: unknown
  try {
    let clean = raw
    if (clean.startsWith('```')) {
      clean = clean.split('\n').slice(1).join('\n')
      if (clean.endsWith('```')) clean = clean.slice(0, -3)
      clean = clean.trim()
    }
    parsed = JSON.parse(clean)
  } catch {
    return apiError('analysis_failed', 'Failed to parse model output as JSON', 500)
  }

  const normalized = normalizeParsed(parsed)
  if (!normalized) {
    return apiError('analysis_failed', 'Model returned no usable elements', 500)
  }

  return NextResponse.json(normalized)
}

export const POST = withApiAuth(ENDPOINT, parseHandler)

export function OPTIONS(): NextResponse {
  return corsPreflight()
}

export function GET(): NextResponse {
  return withCors(
    NextResponse.json(
      { error: { code: 'method_not_allowed', message: 'Use POST' } },
      { status: 405 },
    ),
  )
}
