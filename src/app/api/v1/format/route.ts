import { NextRequest, NextResponse } from 'next/server'
import {
  formatForModel,
  MODELS,
  type ModelId,
  type PromptElements,
} from '@/lib/prompt-formatters'
import {
  withApiAuth,
  apiError,
  corsPreflight,
  withCors,
} from '@/lib/api-middleware'

const ENDPOINT = '/api/v1/format'

const SUPPORTED_IDS = new Set<string>(MODELS.map((m) => m.id))

const ELEMENT_KEYS: (keyof PromptElements)[] = [
  'subject',
  'action_pose',
  'setting',
  'lighting',
  'composition',
  'style',
  'mood',
  'technical',
]

interface FormatBody {
  elements?: unknown
  model?: unknown
  negative_prompt?: unknown
}

async function formatHandler(req: NextRequest): Promise<NextResponse> {
  let body: FormatBody
  try {
    body = (await req.json()) as FormatBody
  } catch {
    return apiError('bad_request', 'Request body must be valid JSON', 400)
  }

  const model = typeof body.model === 'string' ? body.model : ''
  if (!model) return apiError('bad_request', 'model is required', 400)
  if (!SUPPORTED_IDS.has(model)) {
    return apiError(
      'bad_request',
      `Unsupported model "${model}". Supported: ${MODELS.map((m) => m.id).join(', ')}`,
      400,
    )
  }

  if (!body.elements || typeof body.elements !== 'object') {
    return apiError(
      'bad_request',
      'elements object is required with keys: ' + ELEMENT_KEYS.join(', '),
      400,
    )
  }
  const src = body.elements as Record<string, unknown>
  const elements: PromptElements = {
    subject: String(src.subject ?? ''),
    action_pose: String(src.action_pose ?? ''),
    setting: String(src.setting ?? ''),
    lighting: String(src.lighting ?? ''),
    composition: String(src.composition ?? ''),
    style: String(src.style ?? ''),
    mood: String(src.mood ?? ''),
    technical: String(src.technical ?? ''),
  }
  const hasAny = Object.values(elements).some((v) => v.trim().length > 0)
  if (!hasAny) {
    return apiError('bad_request', 'elements must contain at least one non-empty field', 400)
  }

  const formatted = formatForModel(model as ModelId, elements)
  const info = MODELS.find((m) => m.id === model)
  const negative =
    info?.supportsNegative && typeof body.negative_prompt === 'string'
      ? body.negative_prompt
      : null

  return NextResponse.json({
    formatted_prompt: formatted,
    negative_prompt: negative,
    model,
    model_info: info
      ? {
          name: info.name,
          family: info.family,
          prompt_style: info.promptStyle,
          ideal_length: info.idealLength,
          supports_negative: info.supportsNegative,
        }
      : null,
  })
}

export const POST = withApiAuth(ENDPOINT, formatHandler)

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
