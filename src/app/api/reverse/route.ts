import { NextResponse } from 'next/server'

const SYSTEM_PROMPT = `You are an expert AI image prompt engineer. Given an image, you reverse-engineer the exact prompt that could recreate it.

Return ONLY a JSON object with no markdown, no backticks, no explanation:
{
  "prompt": "The detailed prompt that could recreate this image. Include: subject description, setting, lighting, camera angle, lens, film stock/style, color palette, mood, and any specific technical details. Write it as a single flowing prompt paragraph, 150-300 words.",
  "negative_prompt": "Things to avoid: list any artifacts or unwanted elements to exclude",
  "visual_style": "one of: Photorealistic, Cinematic, Editorial, Vintage/Film, Raw/Candid, Anime/Illustration",
  "lighting": "one of: Natural/Golden Hour, Studio, Flash/Harsh, Moody/Low-key, Neon/Colored, Backlit",
  "mood": "one of: Warm, Cold, Dramatic, Dark/Gritty, Clean/Minimal, Energetic, Nostalgic, Intimate",
  "composition": "one of: Close-up, Medium Shot, Full Body, Wide/Establishing, Overhead/Flat Lay, POV/First Person",
  "camera": "one of: DSLR/Mirrorless, Smartphone/Selfie, Film Camera, Drone/Aerial, Vintage Point-and-Shoot, Security Cam/CCTV",
  "category": "one of: Portrait & Headshot, Fashion & Editorial, Product Photography, Cinematic & Film Still, Street & Documentary, Fantasy & Creative, Landscape & Architecture, Identity Transform",
  "suggested_models": ["list 1-3 AI models best suited for this style from: Nano Banana Pro, Soul v1, Soul v2, Flux Schnell, Flux Pro v1.1, Seedream, Seedream 4.5, AI Influencer, Cinematic Studio"]
}`

const VALID_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
const MAX_BYTES = 10 * 1024 * 1024

export async function POST(req: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey || apiKey.trim() === '') {
      console.error('ANTHROPIC_API_KEY is not set')
      return NextResponse.json({ error: 'Image analysis is not configured.' }, { status: 503 })
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
        max_tokens: 4096,
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
                text: 'Reverse-engineer this image into a detailed, production-ready prompt.',
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

    if (!parsed || typeof parsed !== 'object' || typeof (parsed as { prompt?: unknown }).prompt !== 'string') {
      return NextResponse.json({ error: 'Invalid analysis response. Try again.' }, { status: 500 })
    }

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Reverse engineer error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
