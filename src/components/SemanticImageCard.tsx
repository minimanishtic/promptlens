'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Eye } from 'lucide-react'
import { useState } from 'react'
import type { SemanticResult } from '@/app/api/search/route'
import { MODEL_DISPLAY_NAMES } from '@/types/database'

interface SemanticImageCardProps {
  result: SemanticResult
  priority?: boolean
  sizes?: string
}

const MODEL_COLORS: Record<string, string> = {
  text2image_soul_v2: 'bg-purple-600',
  nano_banana_2: 'bg-yellow-600',
  nano_banana_flash: 'bg-amber-500',
  seedream_v4_5: 'bg-blue-600',
  seedream_v5_lite: 'bg-blue-500',
  ai_influencer: 'bg-pink-600',
  flux_2: 'bg-green-600',
  image_auto: 'bg-teal-600',
  text2keyframes: 'bg-orange-600',
  seedream: 'bg-indigo-600',
}

export default function SemanticImageCard({
  result,
  priority = false,
  sizes = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw',
}: SemanticImageCardProps) {
  const thumbnailUrl = result.output_image_url_min ?? result.output_image_url
  const modelLabel = result.model ? (MODEL_DISPLAY_NAMES[result.model] ?? result.model) : null
  const modelColor = result.model ? (MODEL_COLORS[result.model] ?? 'bg-zinc-600') : 'bg-zinc-600'
  const matchPct = Math.round(result.similarity * 100)
  const [loaded, setLoaded] = useState(false)

  return (
    <Link href={`/image/${result.job_set_id}`} className="group block">
      <div className="relative overflow-hidden rounded-lg bg-zinc-900 aspect-[3/4]">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={result.prompt ?? 'AI generated image'}
            fill
            className={`object-cover transition-all duration-500 group-hover:scale-105 ${loaded ? 'opacity-100' : 'opacity-0'}`}
            sizes={sizes}
            unoptimized
            priority={priority}
            loading={priority ? 'eager' : 'lazy'}
            onLoad={() => setLoaded(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
            <span className="text-zinc-600 text-sm">No image</span>
          </div>
        )}

        {/* Shimmer while loading */}
        {!loaded && thumbnailUrl && (
          <div className="absolute inset-0 bg-zinc-800 animate-pulse" />
        )}

        {/* Similarity badge — top right */}
        <div className="absolute top-2 right-2">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
            ${matchPct >= 85 ? 'bg-sky-500 text-white' :
              matchPct >= 70 ? 'bg-sky-500/70 text-white' :
              'bg-zinc-800/80 text-zinc-300'}
          `}>
            {matchPct}%
          </span>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
          <div className="flex items-center justify-between gap-1">
            {modelLabel && (
              <span className={`text-white text-[10px] font-semibold px-1.5 py-0.5 rounded ${modelColor} truncate max-w-[60%]`}>
                {modelLabel}
              </span>
            )}
            {result.views_count != null && (
              <span className="flex items-center gap-1 text-white/80 text-[10px] ml-auto shrink-0">
                <Eye className="w-3 h-3" />
                {result.views_count >= 1000
                  ? `${(result.views_count / 1000).toFixed(1)}k`
                  : result.views_count}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
