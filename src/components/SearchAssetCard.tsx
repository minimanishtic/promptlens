'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { Bookmark, Check, Copy, Sparkles } from 'lucide-react'
import { generationThumbnailUrl } from '@/lib/generation-image-url'
import { logEvent } from '@/lib/analytics'
import { getModelDisplayName, type SearchGridItem } from '@/lib/search-filter-options'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase-client'

const MODEL_DOT: Record<string, string> = {
  text2image_soul_v2: '#c084fc',
  nano_banana_2: '#f59e0b',
  nano_banana_flash: '#fbbf24',
  seedream_v4_5: '#60a5fa',
  seedream_v5_lite: '#3b82f6',
  ai_influencer: '#f472b6',
  flux_2: '#34d399',
  image_auto: '#2dd4bf',
  text2keyframes: '#fb923c',
  seedream: '#818cf8',
}

function pickTags(gen: SearchGridItem): { key: string; label: string; filter: 'primary_category' | 'visual_style' | 'lighting' | 'mood'; value: string }[] {
  const out: { key: string; label: string; filter: 'primary_category' | 'visual_style' | 'lighting' | 'mood'; value: string }[] = []
  if (gen.primary_category) out.push({ key: 'cat', label: gen.primary_category, filter: 'primary_category', value: gen.primary_category })
  if (gen.visual_style) out.push({ key: 'vs', label: gen.visual_style, filter: 'visual_style', value: gen.visual_style })
  if (gen.lighting) out.push({ key: 'li', label: gen.lighting, filter: 'lighting', value: gen.lighting })
  if (gen.mood) out.push({ key: 'mo', label: gen.mood, filter: 'mood', value: gen.mood })
  return out.slice(0, 4)
}

interface Props {
  item: SearchGridItem
  onOpen: (item: SearchGridItem) => void
  onTagClick: (filter: 'primary_category' | 'visual_style' | 'lighting' | 'mood', value: string) => void
  onMoreLikeThis: (item: SearchGridItem) => void
}

/** Intrinsic size for next/image so column layout reserves height before decode (flow layout, not absolute fill). */
function thumbnailLayoutDimensions(item: SearchGridItem): { w: number; h: number } {
  const iw = item.width
  const ih = item.height
  if (typeof iw === 'number' && typeof ih === 'number' && iw > 0 && ih > 0) {
    const base = 480
    return { w: base, h: Math.max(1, Math.round((base * ih) / iw)) }
  }
  return { w: 480, h: 640 }
}

export default function SearchAssetCard({ item, onOpen, onTagClick, onMoreLikeThis }: Props) {
  const thumb = generationThumbnailUrl(item)
  const { user, openAuth } = useAuth()
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)
  const layoutDims = thumbnailLayoutDimensions(item)

  useEffect(() => {
    setImgLoaded(false)
  }, [item.id, thumb])

  useEffect(() => {
    if (!user) {
      setSaved(false)
      return
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any
    void supabase
      .from('saved_prompts')
      .select('id')
      .eq('user_id', user.id)
      .eq('job_set_id', item.job_set_id)
      .maybeSingle()
      .then(({ data }: { data: { id: string } | null }) => setSaved(!!data))
  }, [user, item.job_set_id])
  const modelLabel = item.model ? getModelDisplayName(item.model) : null
  const dot = item.model ? MODEL_DOT[item.model] ?? '#a1a1aa' : '#a1a1aa'
  const tags = pickTags(item)
  const ar = item.aspect_ratio ?? '—'

  const copyPrompt = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation()
      const p = item.prompt ?? ''
      if (!p) return
      try {
        await navigator.clipboard.writeText(p)
        void logEvent('copy', { generation_id: item.job_set_id, model: item.model })
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch {
        /* ignore */
      }
    },
    [item.prompt, item.job_set_id, item.model],
  )

  const toggleSave = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation()
      void logEvent('save_attempt', { generation_id: item.job_set_id })
      if (!user) {
        openAuth('login')
        return
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = createClient() as any
      if (saved) {
        await supabase.from('saved_prompts').delete().eq('user_id', user.id).eq('job_set_id', item.job_set_id)
        setSaved(false)
        return
      }
      const { error } = await supabase.from('saved_prompts').insert({ user_id: user.id, job_set_id: item.job_set_id })
      if (!error) {
        setSaved(true)
        void logEvent('save_complete', { generation_id: item.job_set_id })
      }
    },
    [user, openAuth, saved, item.job_set_id],
  )

  const moreLike = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onMoreLikeThis(item)
    },
    [item, onMoreLikeThis],
  )

  if (!thumb) {
    return (
      <div className="rounded-lg border border-white/[0.06] bg-[#141414] p-8 text-center text-xs text-white/30">
        No image
      </div>
    )
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(item)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen(item)
        }
      }}
      className="group relative w-full cursor-pointer overflow-hidden rounded-lg border border-white/[0.06] outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 [break-inside:avoid]"
    >
      <div className="relative w-full min-h-[1px] overflow-hidden rounded-lg bg-white/[0.06]">
        {!imgLoaded && (
          <div
            className="absolute inset-0 z-[1] animate-pulse bg-white/[0.08]"
            aria-hidden
          />
        )}
        <Image
          src={thumb}
          alt=""
          width={layoutDims.w}
          height={layoutDims.h}
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 34vw, (max-width: 1280px) 25vw, 20vw"
          className={`relative z-[2] h-auto w-full object-cover transition-opacity duration-300 ease-out ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          unoptimized
          loading="lazy"
          decoding="async"
          onLoad={() => setImgLoaded(true)}
        />
      </div>

      {/* Mobile: always copy + model hint */}
      <button
        type="button"
        onClick={copyPrompt}
        className={`absolute bottom-2 right-2 z-[2] flex items-center gap-1 rounded-lg p-1.5 text-white md:hidden transition-colors ${
          copied ? 'bg-green-600' : 'bg-[rgba(220,38,38,0.85)]'
        }`}
        aria-label={copied ? 'Copied' : 'Copy prompt'}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
      {modelLabel && (
        <div className="absolute bottom-2 left-2 z-[2] flex max-w-[55%] items-center gap-1 rounded-xl border border-white/20 bg-black/60 px-2 py-0.5 md:hidden">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: dot }} />
          <span className="truncate text-[9px] text-white">{modelLabel}</span>
        </div>
      )}

      {/* Hover overlay — desktop / tablet */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-[250ms] ease-out group-hover:pointer-events-auto group-hover:opacity-100 max-md:hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 40%), linear-gradient(0deg, rgba(0,0,0,0.8) 0%, transparent 50%)',
          }}
        />
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          <span className="rounded-xl border border-white/20 bg-black/60 px-2 py-0.5 text-[10px] text-white">{ar}</span>
        </div>
        {modelLabel && (
          <div className="absolute right-2 top-2 flex items-center gap-1.5 rounded-xl border border-white/20 bg-black/60 px-2 py-0.5">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: dot }} />
            <span className="text-[10px] text-white">{modelLabel}</span>
          </div>
        )}
        <div className="absolute inset-x-2 top-1/2 flex -translate-y-1/2 flex-wrap justify-center gap-1.5">
          {tags.map((t) => (
            <button
              key={t.key + t.value}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onTagClick(t.filter, t.value)
              }}
              className="pointer-events-auto rounded-xl border border-white/10 bg-white/10 px-2.5 py-1 text-[10px] text-white/80 transition-colors hover:bg-[rgba(220,38,38,0.3)]"
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={moreLike}
          className="pointer-events-auto absolute bottom-12 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/15 bg-black/50 px-3 py-1 text-[10px] text-white/80 hover:bg-white/10"
        >
          <Sparkles className="h-3.5 w-3.5" />
          More like this
        </button>
        <button
          type="button"
          onClick={toggleSave}
          className="pointer-events-auto absolute bottom-2 left-2 rounded-lg p-2 text-white/60 hover:text-white"
          aria-label={saved ? 'Saved' : 'Save'}
        >
          <Bookmark className={`h-4 w-4 ${saved ? 'fill-white text-white' : ''}`} />
        </button>
        <button
          type="button"
          onClick={copyPrompt}
          className={`pointer-events-auto absolute bottom-2 right-2 flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-white transition-colors ${
            copied ? 'bg-green-600' : 'bg-[rgba(220,38,38,0.8)]'
          }`}
          aria-label={copied ? 'Copied' : 'Copy prompt'}
        >
          {copied ? <Check className="h-4 w-4 shrink-0" /> : <Copy className="h-4 w-4 shrink-0" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Decorative upload icon space — hidden on card, spec reference */}
      <span className="sr-only">Open detail</span>
    </div>
  )
}
