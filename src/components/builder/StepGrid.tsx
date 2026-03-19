'use client'

import { Loader2 } from 'lucide-react'
import OptionCard from './OptionCard'
import type { WizardOption } from '@/app/api/builder/route'
import { MODEL_DISPLAY_NAMES } from '@/types/database'

const STEP_DESCRIPTIONS: Record<string, string> = {
  // visual style
  Photorealistic: 'Sharp, accurate, indistinguishable from a photo',
  Editorial: 'Magazine-quality, polished and intentional',
  Cinematic: 'Movie-frame depth, dramatic composition',
  'Vintage/Film': 'Film grain, muted tones, analog warmth',
  'Anime/Illustration': 'Stylised, drawn aesthetic',
  'Raw/Candid': 'Unposed, authentic, documentary feel',
  // lighting
  Studio: 'Controlled, clean, professional',
  'Natural/Golden Hour': 'Warm sunlight, soft shadows',
  'Flash/Harsh': 'High contrast, direct flash',
  'Moody/Low-key': 'Deep shadows, minimal fill',
  'Neon/Colored': 'Colored gels, neon ambiance',
  Backlit: 'Light behind subject, rim glow',
  // mood
  Warm: 'Golden tones, inviting atmosphere',
  Cold: 'Blue-white palette, distant feel',
  Dramatic: 'High contrast, emotional tension',
  Intimate: 'Close, personal, quiet',
  Energetic: 'Dynamic, vibrant, movement',
  Nostalgic: 'Soft and memory-like',
  'Dark/Gritty': 'Raw, urban, textured',
  'Clean/Minimal': 'Sparse, airy, refined',
  // composition
  'Close-up': 'Tight on face or detail',
  'Medium Shot': 'Waist up, balanced framing',
  'Full Body': 'Head to toe, environment context',
  'Wide/Establishing': 'Broad scene, sense of place',
  'Overhead/Flat Lay': "Bird's-eye view, graphic layout",
  'POV/First Person': 'Through the subject\'s eyes',
}

interface Props {
  options: WizardOption[]
  selected: string
  onSelect: (value: string) => void
  loading: boolean
  cols?: 2 | 3
  imageCount?: 1 | 2
  isModelStep?: boolean
}

export default function StepGrid({ options, selected, onSelect, loading, cols = 3, imageCount = 2, isModelStep }: Props) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-zinc-500">
        <Loader2 className="w-7 h-7 animate-spin text-violet-500" />
        <span className="text-sm">Loading examples…</span>
      </div>
    )
  }

  const gridClass = cols === 2
    ? 'grid grid-cols-1 sm:grid-cols-2 gap-3'
    : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'

  return (
    <div className={gridClass}>
      {options.map((opt) => {
        const displayName = isModelStep ? (MODEL_DISPLAY_NAMES[opt.value] ?? opt.value) : opt.value
        const sub = isModelStep
          ? `${opt.count.toLocaleString()} images · avg ${(opt.avg_views ?? 0).toLocaleString()} views`
          : STEP_DESCRIPTIONS[opt.value]

        return (
          <div key={opt.value} className="relative">
            {opt.recommended && (
              <div className="absolute -top-2 left-3 z-10 px-2 py-0.5 rounded-full bg-violet-600 text-white text-[10px] font-bold uppercase tracking-wide shadow">
                Recommended
              </div>
            )}
            <OptionCard
              option={opt}
              label={displayName}
              sublabel={sub}
              selected={selected === opt.value}
              onClick={() => onSelect(opt.value)}
              imageCount={imageCount}
            />
          </div>
        )
      })}
    </div>
  )
}
