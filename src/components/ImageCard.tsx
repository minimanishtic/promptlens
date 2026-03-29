'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Eye } from 'lucide-react'
import { useState } from 'react'
import type { Generation } from '@/types/database'
import { MODEL_DISPLAY_NAMES } from '@/types/database'
import { generationThumbnailUrl } from '@/lib/generation-image-url'

interface ImageCardProps {
  image: Generation
  priority?: boolean
  sizes?: string
}

/** Flow layout dimensions so the grid reserves space before the image decodes. */
function thumbnailLayoutDimensions(image: Generation): { w: number; h: number } {
  const iw = image.width
  const ih = image.height
  if (typeof iw === 'number' && typeof ih === 'number' && iw > 0 && ih > 0) {
    const base = 480
    return { w: base, h: Math.max(1, Math.round((base * ih) / iw)) }
  }
  return { w: 480, h: 640 }
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

export default function ImageCard({
  image,
  priority = false,
  sizes = '(max-width: 768px) 50vw, (max-width: 1024px) 34vw, (max-width: 1280px) 25vw, 20vw',
}: ImageCardProps) {
  const thumbnailUrl = generationThumbnailUrl(image)
  const modelLabel = image.model ? (MODEL_DISPLAY_NAMES[image.model] ?? image.model) : null
  const modelColor = image.model ? (MODEL_COLORS[image.model] ?? 'bg-zinc-600') : 'bg-zinc-600'
  const [loaded, setLoaded] = useState(false)
  const layoutDims = thumbnailLayoutDimensions(image)

  return (
    <Link href={`/image/${image.job_set_id}`} className="group block w-full [break-inside:avoid]">
      <div className="relative w-full min-h-[1px] overflow-hidden rounded-lg bg-zinc-900">
        {thumbnailUrl ? (
          <>
            {!loaded && (
              <div className="absolute inset-0 z-[1] bg-zinc-800 animate-pulse" aria-hidden />
            )}
            <Image
              src={thumbnailUrl}
              alt={image.prompt ?? 'AI generated image'}
              width={layoutDims.w}
              height={layoutDims.h}
              className={`relative z-[2] h-auto w-full object-cover transition-all duration-500 group-hover:scale-105 ${loaded ? 'opacity-100' : 'opacity-0'}`}
              sizes={sizes}
              unoptimized
              priority={priority}
              loading={priority ? 'eager' : 'lazy'}
              onLoad={() => setLoaded(true)}
            />
          </>
        ) : (
          <div className="flex aspect-[3/4] w-full items-center justify-center bg-zinc-800">
            <span className="text-sm text-zinc-600">No image</span>
          </div>
        )}

        {/* Overlay on hover */}
        <div className="pointer-events-none absolute inset-0 z-[3] bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 z-[3] bg-gradient-to-t from-black/70 to-transparent p-2">
          <div className="flex items-center justify-between gap-1">
            {modelLabel && (
              <span className={`text-white text-[10px] font-semibold px-1.5 py-0.5 rounded ${modelColor} truncate max-w-[60%]`}>
                {modelLabel}
              </span>
            )}
            {image.views_count != null && (
              <span className="flex items-center gap-1 text-white/80 text-[10px] ml-auto shrink-0">
                <Eye className="w-3 h-3" />
                {image.views_count >= 1000
                  ? `${(image.views_count / 1000).toFixed(1)}k`
                  : image.views_count}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
