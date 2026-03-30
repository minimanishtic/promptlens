'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { X, Copy, Share2 } from 'lucide-react'
import type { Generation } from '@/types/database'
import { getModelDisplayName } from '@/lib/search-filter-options'
import { logEvent } from '@/lib/analytics'
import SavePromptButton from '@/components/SavePromptButton'
import { supabase as browserSupabase } from '@/lib/supabase'

interface Props {
  open: boolean
  gen: Generation | null
  onClose: () => void
  flatItems: Generation[]
  index: number
  onNavigate: (nextIndex: number) => void
  onPickSimilar: (g: Generation) => void
  /** For analytics detail_view source */
  detailSource?: string
}

function browseCategoryHref(value: string | null) {
  if (!value) return '/browse'
  return `/browse?category=${encodeURIComponent(value)}`
}

export default function ImageSlidePanel({
  open,
  gen,
  onClose,
  flatItems,
  index,
  onNavigate,
  onPickSimilar,
  detailSource = 'unknown',
}: Props) {
  const [similar, setSimilar] = useState<Generation[]>([])
  const [copyFlash, setCopyFlash] = useState(false)
  const detailLoggedRef = useRef<string | null>(null)

  useEffect(() => {
    if (!gen) {
      setSimilar([])
      return
    }
    let cancelled = false
    ;(async () => {
      let q = browserSupabase
        .from('generations')
        .select('*')
        .neq('job_set_id', gen.job_set_id)
        .order('sort_priority', { ascending: true })
        .order('views_count', { ascending: false })
        .limit(8)
      if (gen.primary_category) q = q.eq('primary_category', gen.primary_category)
      if (gen.visual_style) q = q.eq('visual_style', gen.visual_style)
      const { data } = await q
      if (!cancelled) setSimilar((data as Generation[]) ?? [])
    })()
    return () => {
      cancelled = true
    }
  }, [gen])

  useEffect(() => {
    if (!open || !gen) return
    if (detailLoggedRef.current === gen.job_set_id) return
    detailLoggedRef.current = gen.job_set_id
    void logEvent('detail_view', { generation_id: gen.job_set_id, source: detailSource })
  }, [open, gen, detailSource])

  useEffect(() => {
    if (!open) detailLoggedRef.current = null
  }, [open])

  const copyPrompt = useCallback(async () => {
    if (!gen?.prompt) return
    try {
      await navigator.clipboard.writeText(gen.prompt)
      void logEvent('copy', { generation_id: gen.job_set_id, model: gen.model })
      setCopyFlash(true)
      setTimeout(() => setCopyFlash(false), 1500)
    } catch {
      /* ignore */
    }
  }, [gen])

  const shareUrl = useCallback(async () => {
    if (!gen) return
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/image/${gen.job_set_id}`
    try {
      await navigator.clipboard.writeText(url)
      void logEvent('copy', { generation_id: gen.job_set_id, kind: 'share_link' })
    } catch {
      /* ignore */
    }
  }, [gen])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && index > 0) {
        e.preventDefault()
        onNavigate(index - 1)
      }
      if (e.key === 'ArrowRight' && index < flatItems.length - 1) {
        e.preventDefault()
        onNavigate(index + 1)
      }
      if (e.key === 'c' || e.key === 'C') {
        if (e.metaKey || e.ctrlKey) return
        const t = e.target as HTMLElement
        if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') return
        e.preventDefault()
        void copyPrompt()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, index, flatItems.length, onClose, onNavigate, copyPrompt])

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open || !gen) return null

  const modelLabel = gen.model ? getModelDisplayName(gen.model) : '—'
  const dims =
    gen.width && gen.height ? `${gen.width} × ${gen.height}${gen.aspect_ratio ? ` · ${gen.aspect_ratio}` : ''}` : gen.aspect_ratio ?? '—'

  const tagClass =
    'inline-flex rounded-full border border-[rgba(220,38,38,0.2)] px-2.5 py-1 text-xs text-[rgba(255,140,140,0.7)] hover:bg-red-950/40 transition-colors'

  return (
    <>
      <button
        type="button"
        aria-label="Close panel"
        className="fixed inset-0 z-[60] bg-black/40 md:bg-black/40"
        onClick={onClose}
      />
      <aside className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-full animate-in slide-in-from-right duration-300 flex-col border-l border-white/[0.08] bg-[#111111] shadow-2xl md:max-w-[480px]">

        <div className="flex items-center justify-end border-b border-white/[0.06] px-3 py-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-white/50 transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8 pt-2">
          <div className="relative mx-auto max-h-[45vh] overflow-hidden rounded-lg bg-black">
            {gen.output_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={gen.output_image_url}
                alt={gen.prompt ?? ''}
                className="mx-auto block h-auto max-h-[45vh] w-full object-contain"
              />
            ) : (
              <div className="flex aspect-square items-center justify-center text-white/30">No image</div>
            )}
          </div>
          <p className="mt-2 text-center text-xs text-white/40">{dims}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void copyPrompt()}
              className="rounded-lg bg-[#dc2626] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
            >
              Copy prompt
            </button>
            <SavePromptButton jobSetId={gen.job_set_id} />
            <button
              type="button"
              onClick={() => void shareUrl()}
              className="flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2.5 text-sm text-white/80 hover:bg-white/5"
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
          </div>

          <div className="relative mt-6 rounded-lg border border-white/[0.08] bg-white/[0.04] p-4">
            <button
              type="button"
              onClick={() => void copyPrompt()}
              className="absolute right-3 top-3 rounded p-1 text-white/40 hover:bg-white/10 hover:text-white"
              aria-label="Copy prompt"
            >
              <Copy className="h-4 w-4" />
            </button>
            <pre className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-white/[0.8] pr-8">
              {gen.prompt ?? 'No prompt'}
            </pre>
            {copyFlash && <span className="mt-2 block text-xs text-green-400">Copied</span>}
          </div>

          <div className="mt-6 space-y-2">
            <div className="flex flex-wrap gap-2">
              {gen.primary_category && (
                <Link href={browseCategoryHref(gen.primary_category)} className={tagClass}>
                  {gen.primary_category}
                </Link>
              )}
              {gen.sub_category && (
                <Link href="/browse" className={tagClass}>
                  {gen.sub_category}
                </Link>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {gen.visual_style && (
                <Link href="/browse" className={tagClass}>
                  {gen.visual_style}
                </Link>
              )}
              {gen.lighting && (
                <Link href="/browse" className={tagClass}>
                  {gen.lighting}
                </Link>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {gen.mood && (
                <Link href="/browse" className={tagClass}>
                  {gen.mood}
                </Link>
              )}
              {gen.composition && (
                <Link href="/browse" className={tagClass}>
                  {gen.composition}
                </Link>
              )}
              {gen.camera_simulation && (
                <Link href="/browse" className={tagClass}>
                  {gen.camera_simulation}
                </Link>
              )}
            </div>
          </div>

          <div className="mt-6 space-y-1 border-t border-white/[0.06] pt-4 text-[13px]">
            <div className="flex gap-2">
              <span className="text-white/40">Model</span>
              <span className="text-white/70">{modelLabel}</span>
            </div>
            {gen.seed != null && (
              <div className="flex gap-2">
                <span className="text-white/40">Seed</span>
                <span className="text-white/70">{gen.seed}</span>
              </div>
            )}
            <div className="flex gap-2">
              <span className="text-white/40">Platform</span>
              <span className="text-white/70">Promere</span>
            </div>
            {gen.quality && (
              <div className="flex gap-2">
                <span className="text-white/40">Quality</span>
                <span className="text-white/70">{gen.quality}</span>
              </div>
            )}
          </div>

          {similar.length > 0 && (
            <div className="mt-8">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-white/40">Similar images</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {similar.map((img) => {
                  const src = img.output_image_url_min ?? img.output_image_url
                  if (!src) return null
                  return (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => onPickSimilar(img)}
                      className="relative h-20 w-14 shrink-0 overflow-hidden rounded-md border border-white/10"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="mt-8 border-t border-white/[0.06] pt-4 text-xs text-white/50">
            <p>
              {gen.source === 'original' ? (
                <>Created by Konvert Media</>
              ) : gen.creator_username ? (
                <>Created by @{gen.creator_username}</>
              ) : (
                <>Community image</>
              )}
            </p>
            {(!gen.source || gen.source === 'community') && (
              <a
                href={`mailto:content@konvert.media?subject=${encodeURIComponent('Image Removal Request')}&body=${encodeURIComponent(`Image ID: ${gen.job_set_id}\nUsername: ${gen.creator_username || 'N/A'}\nReason: `)}`}
                className="mt-2 inline-block text-white/40 underline hover:text-white/70"
              >
                Request removal
              </a>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
