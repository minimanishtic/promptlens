'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Eye, Heart, Check, Copy, ExternalLink, ChevronDown, ChevronUp, RefreshCw, LayoutGrid, Info } from 'lucide-react'
import type { Generation } from '@/types/database'
import { generationThumbnailUrl } from '@/lib/generation-image-url'
import { getModelDisplayName } from '@/lib/search-filter-options'

const RELAX_LABELS = [
  'Exact match',
  'Without composition filter',
  'Without composition & mood',
  'Without composition, mood & lighting',
  'Category & model only',
]

interface Selections {
  category?: string
  visual_style?: string
  lighting?: string
  mood?: string
  composition?: string
  model?: string
}

interface Props {
  prompts: Generation[]
  relaxedLevel: number
  selections: Selections
  onReset: () => void
}

function PromptResultCard({ gen, rank }: { gen: Generation; rank: number }) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)

  const prompt = gen.prompt ?? ''
  const src = generationThumbnailUrl(gen) ?? ''
  const isTruncated = prompt.length > 250
  const displayPrompt = isTruncated && !expanded ? prompt.slice(0, 250) + '…' : prompt

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(prompt) } catch {
      const el = document.createElement('textarea')
      el.value = prompt
      document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col sm:flex-row hover:border-zinc-700 transition-colors">
      {/* Thumbnail */}
      <Link href={`/image/${gen.job_set_id}`} className="relative shrink-0 w-full sm:w-40 h-48 sm:h-auto bg-zinc-800 overflow-hidden group">
        <div className="absolute top-2 left-2 z-10 w-6 h-6 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center text-xs font-bold text-zinc-300">{rank}</div>
        {!imgLoaded && <div className="absolute inset-0 animate-pulse bg-zinc-800" />}
        {src && (
          <Image
            src={src} alt={prompt.slice(0, 60)} fill
            className={`object-cover transition-all duration-300 group-hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            sizes="(max-width: 640px) 100vw, 160px" unoptimized loading="lazy"
            onLoad={() => setImgLoaded(true)}
          />
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-3 min-w-0">
        {/* Meta */}
        <div className="flex flex-wrap items-center gap-2">
          {gen.model && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/20">
              {getModelDisplayName(gen.model)}
            </span>
          )}
          {gen.visual_style && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">{gen.visual_style}</span>
          )}
          <div className="flex items-center gap-3 ml-auto text-xs text-zinc-500">
            <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{(gen.views_count ?? 0).toLocaleString()}</span>
            <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{(gen.likes_count ?? 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Prompt */}
        <div className="flex-1">
          <p className="text-sm text-zinc-300 leading-relaxed font-mono whitespace-pre-wrap break-words">{displayPrompt}</p>
          {isTruncated && (
            <button onClick={() => setExpanded(e => !e)} className="mt-1.5 flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 transition-colors">
              {expanded ? <><ChevronUp className="w-3.5 h-3.5" />Show less</> : <><ChevronDown className="w-3.5 h-3.5" />Show full ({prompt.length.toLocaleString()} chars)</>}
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1 border-t border-zinc-800">
          <button onClick={handleCopy} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${copied ? 'bg-green-600/20 text-green-400 border border-green-600/30' : 'bg-sky-500 hover:bg-sky-400 text-white'}`}>
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy Prompt'}
          </button>
          <Link href={`/image/${gen.job_set_id}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 transition-colors">
            <ExternalLink className="w-3.5 h-3.5" />View Details
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function ResultPanel({ prompts, relaxedLevel, selections, onReset }: Props) {
  const searchParams = new URLSearchParams()
  if (selections.category) searchParams.set('category', selections.category)
  if (selections.visual_style) searchParams.set('visual_style', selections.visual_style)
  if (selections.lighting) searchParams.set('lighting', selections.lighting)
  if (selections.mood) searchParams.set('mood', selections.mood)
  if (selections.composition) searchParams.set('composition', selections.composition)
  if (selections.model) searchParams.set('model', selections.model)
  const searchUrl = `/search?${searchParams.toString()}`

  // Selection pills
  const pills = [
    selections.category,
    selections.visual_style,
    selections.lighting,
    selections.mood,
    selections.composition,
    selections.model ? getModelDisplayName(selections.model) : undefined,
  ].filter(Boolean) as string[]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Your prompt profile</h2>
            <p className="text-sm text-zinc-500">Based on your selections</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Start over
            </button>
            <Link
              href={searchUrl}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition-colors"
            >
              <LayoutGrid className="w-4 h-4" />
              Browse all matches
            </Link>
          </div>
        </div>

        {/* Pills */}
        <div className="flex flex-wrap gap-2">
          {pills.map((pill, i) => (
            <span key={i} className="text-sm px-3 py-1 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/25 font-medium">
              {pill}
            </span>
          ))}
        </div>
      </div>

      {/* Results section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">
              {relaxedLevel === 0 ? 'Top matching prompts' : 'Similar prompts'}
            </h3>
            {relaxedLevel > 0 && (
              <div className="flex items-center gap-1.5 mt-1 text-xs text-amber-400/80">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>{RELAX_LABELS[relaxedLevel]} — showing closest matches</span>
              </div>
            )}
          </div>
          <span className="text-xs text-zinc-600">{prompts.length} prompt{prompts.length !== 1 ? 's' : ''}</span>
        </div>

        {prompts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center bg-zinc-900 border border-zinc-800 rounded-xl">
            <p className="text-zinc-400">No prompts found for this combination.</p>
            <p className="text-zinc-600 text-sm">Try a different set of options, or browse all images.</p>
            <Link href="/browse" className="mt-2 text-xs text-sky-400 hover:text-sky-300 underline underline-offset-2">
              Browse all images
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {prompts.map((p, i) => (
              <PromptResultCard key={p.id} gen={p} rank={i + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
