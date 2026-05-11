import { NextResponse } from 'next/server'
import { MODELS } from '@/lib/prompt-formatters'
import { corsPreflight, withCors } from '@/lib/api-middleware'

// Public — no auth required.
export function GET(): NextResponse {
  const models = MODELS.map((m) => ({
    id: m.id,
    name: m.name,
    family: m.family,
    description: m.description,
    prompt_style: m.promptStyle,
    ideal_length: m.idealLength,
    supports_negative: m.supportsNegative,
  }))
  return withCors(NextResponse.json({ models }))
}

export function OPTIONS(): NextResponse {
  return corsPreflight()
}
