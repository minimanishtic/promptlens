import { NextResponse } from 'next/server'
import { normalizeReversePayload } from '@/lib/prompt-formatters'

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
const MAX_BYTES = 10 * 1024 * 1024

export async function POST(req: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey || apiKey.trim() === '') {
      console.error('ANTHROPIC_API_KEY is not set')
      return NextResponse.json({ error: 'API key not configured' }, { status: 503 })
    }

    const formData = await req.formData()
    const file = formData.get('image')
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    if (!VALID_TYPES.includes(file.type as (typeof VALID_TYPES)[number])) {
      return NextResponse.json({ error: 'Invalid file type. Use JPG, PNG, or WebP.' }, { status: 400 })
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Image too large. Max 10MB.' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/webp'

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
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
              {
                type: 'image',
                source: { type: 'base64', media_type: mediaType, data: base64 },
              },
              {
                type: 'text',
                text: 'Reverse-engineer this image into structured prompt elements.',
              },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Anthropic API error:', response.status, errText)
      return NextResponse.json({ error: 'Failed to analyze image. Try again.' }, { status: 500 })
    }

    const data = (await response.json()) as {
      content?: Array<{ type: string; text?: string }>
    }
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
      console.error('Failed to parse Claude response:', text.slice(0, 500))
      return NextResponse.json({ error: 'Failed to parse analysis. Try again.' }, { status: 500 })
    }

    const normalized = normalizeReversePayload(parsed)
    if (!normalized) {
      return NextResponse.json({ error: 'Invalid analysis response. Try again.' }, { status: 500 })
    }

    return NextResponse.json(normalized)
  } catch (error) {
    console.error('Reverse engineer error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
