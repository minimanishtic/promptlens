'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Generation } from '@/types/database'

interface GlossaryImageRowProps {
  column: string
  value: string
}

export default function GlossaryImageRow({ column, value }: GlossaryImageRowProps) {
  const [images, setImages] = useState<Generation[]>([])
  const [count, setCount] = useState<number | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const fetchedRef = useRef(false)

  // Lazy fetch — only when row scrolls into view
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && !fetchedRef.current) {
          fetchedRef.current = true
          setLoading(true)

          const [imagesRes, countRes] = await Promise.all([
            supabase
              .from('generations')
              .select('*')
              .eq(column, value)
              .not('output_image_url', 'is', null)
              .order('views_count', { ascending: false })
              .limit(8),
            supabase
              .from('generations')
              .select('id', { count: 'exact', head: true })
              .eq(column, value),
          ])

          if (imagesRes.data) setImages(imagesRes.data as Generation[])
          if (countRes.count != null) setCount(countRes.count)
          setLoading(false)
          setLoaded(true)
        }
      },
      { rootMargin: '300px' },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [column, value])

  return (
    <div ref={containerRef} className="mt-3">
      {/* Count */}
      {count != null && (
        <p className="text-xs text-zinc-600 mb-2">
          {count.toLocaleString()} images with this setting
        </p>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="shrink-0 w-32 h-44 rounded-lg bg-zinc-800 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Image row */}
      {loaded && images.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin snap-x snap-mandatory">
          {images.map((img) => {
            const src = img.output_image_url_min ?? img.output_image_url
            return (
              <Link
                key={img.id}
                href={`/image/${img.job_set_id}`}
                className="group shrink-0 w-32 snap-start"
              >
                <div className="relative w-32 h-44 rounded-lg overflow-hidden bg-zinc-800">
                  {src && (
                    <Image
                      src={src}
                      alt={img.prompt ?? value}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="128px"
                      unoptimized
                      loading="lazy"
                    />
                  )}
                </div>
              </Link>
            )
          })}
          {/* Browse all link */}
          <Link
            href={`/browse?${column}=${encodeURIComponent(value)}`}
            className="shrink-0 w-32 h-44 rounded-lg border border-zinc-700 hover:border-violet-600 flex flex-col items-center justify-center gap-2 text-zinc-500 hover:text-violet-400 transition-colors"
          >
            <span className="text-2xl">+</span>
            <span className="text-[10px] text-center leading-tight px-2">View all in Browse</span>
          </Link>
        </div>
      )}

      {/* Empty state */}
      {loaded && images.length === 0 && (
        <p className="text-xs text-zinc-600 italic">No examples yet for this setting.</p>
      )}

      {/* Pre-fetch placeholder */}
      {!loaded && !loading && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="shrink-0 w-32 h-44 rounded-lg bg-zinc-900" />
          ))}
        </div>
      )}
    </div>
  )
}
