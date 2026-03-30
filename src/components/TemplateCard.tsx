'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Eye, Heart, ChevronDown, ChevronUp, ExternalLink, Check, Copy } from 'lucide-react'
import type { Generation } from '@/types/database'
import { MODEL_DISPLAY_NAMES } from '@/types/database'
import { generationThumbnailUrl } from '@/lib/generation-image-url'
import { logEvent } from '@/lib/analytics'

const TRUNCATE_LENGTH = 200

interface Props {
  template: Generation
  rank: number
}

export default function TemplateCard({ template, rank }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)

  const prompt = template.prompt ?? ''
  const src = generationThumbnailUrl(template) ?? ''
  const isTruncated = prompt.length > TRUNCATE_LENGTH
  const displayPrompt = isTruncated && !expanded ? prompt.slice(0, TRUNCATE_LENGTH) + '…' : prompt

  const handleCopy = async () => {
    let copiedOk = false
    try {
      await navigator.clipboard.writeText(prompt)
      copiedOk = true
    } catch {
      try {
        const el = document.createElement('textarea')
        el.value = prompt
        document.body.appendChild(el)
        el.select()
        copiedOk = document.execCommand('copy')
        document.body.removeChild(el)
      } catch {
        /* ignore */
      }
    }
    if (copiedOk) {
      void logEvent('copy', { generation_id: template.job_set_id, model: template.model })
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col sm:flex-row gap-0 hover:border-zinc-700 transition-colors">
      {/* Thumbnail */}
      <Link
        href={`/image/${template.job_set_id}`}
        className="relative shrink-0 w-full sm:w-36 h-48 sm:h-auto bg-zinc-800 overflow-hidden group"
      >
        {/* Rank badge */}
        <div className="absolute top-2 left-2 z-10 w-6 h-6 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center text-xs font-bold text-zinc-300">
          {rank}
        </div>
        {!imgLoaded && (
          <div className="absolute inset-0 animate-pulse bg-zinc-800" />
        )}
        {src && (
          <Image
            src={src}
            alt={prompt.slice(0, 60)}
            fill
            className={`object-cover transition-all duration-300 group-hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            sizes="(max-width: 640px) 100vw, 144px"
            unoptimized
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
          />
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-3 min-w-0">
        {/* Meta row */}
        <div className="flex items-center gap-2 flex-wrap">
          {template.model && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/20">
              {MODEL_DISPLAY_NAMES[template.model] ?? template.model}
            </span>
          )}
          {template.style_name && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
              {template.style_name}
            </span>
          )}
          <div className="flex items-center gap-3 ml-auto text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {(template.views_count ?? 0).toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5" />
              {(template.likes_count ?? 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Prompt */}
        <div className="flex-1">
          <p className="text-sm text-zinc-300 leading-relaxed font-mono whitespace-pre-wrap break-words">
            {displayPrompt}
          </p>
          {isTruncated && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="mt-1.5 flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 transition-colors"
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  Show full prompt ({prompt.length.toLocaleString()} chars)
                </>
              )}
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1 border-t border-zinc-800">
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
              copied
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-sky-500 hover:bg-sky-400 text-white border-transparent'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy Prompt'}
          </button>
          <Link
            href={`/image/${template.job_set_id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View Details
          </Link>
        </div>
      </div>
    </div>
  )
}
