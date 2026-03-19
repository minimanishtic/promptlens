'use client'

import { useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import GlossarySection from '@/components/GlossarySection'
import type { GlossarySectionData } from '@/components/GlossarySection'

const SECTIONS: GlossarySectionData[] = [
  {
    category: 'Visual Style',
    column: 'visual_style',
    options: [
      { value: 'Photorealistic', description: 'Indistinguishable from a real photograph. Sharp details, accurate physics.' },
      { value: 'Editorial', description: 'Magazine-quality styling. Deliberate composition, fashion-forward aesthetic.' },
      { value: 'Cinematic', description: 'Movie-still quality. Dramatic color grading, wide aspect ratios, filmic depth.' },
      { value: 'Vintage/Film', description: 'Analog film look. Grain, muted colors, light leaks, retro processing.' },
      { value: 'Anime/Illustration', description: 'Drawn or painted aesthetic. Cell-shaded, stylized, non-photographic.' },
      { value: 'Raw/Candid', description: 'Unposed, authentic feel. Smartphone-quality, natural imperfections.' },
    ],
  },
  {
    category: 'Lighting',
    column: 'lighting',
    options: [
      { value: 'Studio', description: 'Controlled artificial lighting. Clean backgrounds, professional setup.' },
      { value: 'Natural/Golden Hour', description: 'Outdoor sunlight, especially warm tones near sunrise/sunset.' },
      { value: 'Flash/Harsh', description: 'Direct flash or hard light. Strong shadows, high contrast.' },
      { value: 'Moody/Low-key', description: 'Predominantly dark tones. Dramatic shadows, selective illumination.' },
      { value: 'Neon/Colored', description: 'Colored artificial light. Cyberpunk vibes, nightclub aesthetics.' },
      { value: 'Backlit', description: 'Light source behind the subject. Silhouettes, rim lighting, lens flare.' },
    ],
  },
  {
    category: 'Mood',
    column: 'mood',
    options: [
      { value: 'Warm', description: 'Golden tones, comfort, intimacy. Amber, orange, soft yellow palette.' },
      { value: 'Cold', description: 'Blue-shifted tones, clinical or melancholic. Cool whites and grays.' },
      { value: 'Dramatic', description: 'High contrast, tension, cinematic weight. Bold lighting choices.' },
      { value: 'Intimate', description: 'Close, personal, quiet. Shallow depth of field, soft focus.' },
      { value: 'Energetic', description: 'Movement, action, vibrancy. Bright colors, dynamic poses.' },
      { value: 'Nostalgic', description: 'Wistful, memory-like quality. Faded tones, vintage processing.' },
      { value: 'Dark/Gritty', description: 'Noir, urban, raw. Desaturated with deep blacks.' },
      { value: 'Clean/Minimal', description: 'White space, simplicity, precision. Product photography aesthetic.' },
    ],
  },
  {
    category: 'Composition',
    column: 'composition',
    options: [
      { value: 'Close-up', description: 'Tight framing on face or detail. Fills the frame.' },
      { value: 'Medium Shot', description: 'Waist-up framing. Standard portrait or conversation distance.' },
      { value: 'Full Body', description: 'Head to toe visible. Fashion, lifestyle, full figure.' },
      { value: 'Wide/Establishing', description: 'Environmental context. Subject small in frame, scene-setting.' },
      { value: 'Overhead/Flat Lay', description: "Bird's-eye view. Product layouts, food photography." },
      { value: 'POV/First Person', description: "Through the subject's eyes. Immersive, first-person perspective." },
    ],
  },
  {
    category: 'Camera Simulation',
    column: 'camera_simulation',
    options: [
      { value: 'DSLR/Mirrorless', description: 'Professional camera quality. Sharp, clean, well-exposed.' },
      { value: 'Film Camera', description: 'Analog film characteristics. Grain, color shifts, organic feel.' },
      { value: 'Smartphone/Selfie', description: 'Phone camera look. Slightly wide angle, front-facing perspective.' },
      { value: 'Drone/Aerial', description: 'High altitude perspective. Landscapes, cityscapes from above.' },
      { value: 'Security Cam/CCTV', description: 'Surveillance aesthetic. Low quality, wide angle, timestamp overlay.' },
      { value: 'Vintage Point-and-Shoot', description: 'Compact camera look. Flash artifacts, slight softness.' },
    ],
  },
]

export default function GlossarySearch() {
  const [filterQuery, setFilterQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const allValues = SECTIONS.flatMap((s) => s.options.map((o) => o.value))
  const matchCount = filterQuery.trim()
    ? SECTIONS.flatMap((s) =>
        s.options.filter(
          (o) =>
            o.value.toLowerCase().includes(filterQuery.toLowerCase()) ||
            o.description.toLowerCase().includes(filterQuery.toLowerCase()),
        ),
      ).length
    : allValues.length

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          placeholder="Filter settings... e.g. golden hour, bokeh, cinematic"
          className="w-full bg-zinc-900 border border-zinc-700 focus:border-violet-500 text-white placeholder-zinc-500 rounded-lg pl-9 pr-9 py-2.5 text-sm outline-none transition-colors focus:ring-1 focus:ring-violet-500/30"
        />
        {filterQuery && (
          <button
            onClick={() => setFilterQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Match count when filtering */}
      {filterQuery.trim() && (
        <p className="text-xs text-zinc-500">
          {matchCount} setting{matchCount !== 1 ? 's' : ''} match{matchCount === 1 ? 'es' : ''}{' '}
          <span className="text-violet-400">&ldquo;{filterQuery}&rdquo;</span>
        </p>
      )}

      {/* Sections */}
      <div className="space-y-4">
        {SECTIONS.map((section, i) => (
          <GlossarySection
            key={section.category}
            section={section}
            filterQuery={filterQuery}
            defaultOpen={i === 0}
          />
        ))}
      </div>

      {/* No results */}
      {filterQuery.trim() && matchCount === 0 && (
        <div className="text-center py-16">
          <p className="text-zinc-400 text-sm mb-1">No settings match &ldquo;{filterQuery}&rdquo;</p>
          <button
            onClick={() => setFilterQuery('')}
            className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
          >
            Clear filter
          </button>
        </div>
      )}
    </div>
  )
}
