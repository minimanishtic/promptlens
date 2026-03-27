'use client'

import { useCallback, useEffect, useState } from 'react'
import { X } from 'lucide-react'

export interface ReverseEngineerResult {
  prompt: string
  negative_prompt?: string
  visual_style?: string
  lighting?: string
  mood?: string
  composition?: string
  camera?: string
  category?: string
  suggested_models?: string[]
}

interface Props {
  open: boolean
  onClose: () => void
  previewUrl: string | null
  loading: boolean
  result: ReverseEngineerResult | null
  error: string | null
  onFindSimilar: (prompt: string) => void
}

export default function ReverseResultPanel({
  open,
  onClose,
  previewUrl,
  loading,
  result,
  error,
  onFindSimilar,
}: Props) {
  const [copyFlash, setCopyFlash] = useState(false)

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const copyPrompt = useCallback(async () => {
    if (!result?.prompt) return
    try {
      await navigator.clipboard.writeText(result.prompt)
      setCopyFlash(true)
      setTimeout(() => setCopyFlash(false), 1500)
    } catch {
      /* ignore */
    }
  }, [result?.prompt])

  if (!open) return null

  return (
    <>
      <button
        type="button"
        aria-label="Close panel"
        className="fixed inset-0 z-[75] bg-black/50"
        onClick={onClose}
      />
      <aside className="fixed inset-y-0 right-0 z-[80] flex w-full max-w-full animate-in slide-in-from-right duration-300 flex-col border-l border-white/10 bg-zinc-900 shadow-2xl md:max-w-[480px]">
        <div className="flex shrink-0 items-center justify-end border-b border-white/[0.08] px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-6 pt-2">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-red-500">Reverse Engineer</span>
          </div>

          {previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="" className="mb-6 w-full rounded-lg object-contain max-h-[40vh] bg-black/30" />
          )}

          {error && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-950/20 px-3 py-2 text-sm text-red-200/90">
              {error}
            </div>
          )}

          {loading && (
            <div className="mb-6 space-y-3">
              <p className="text-sm text-white/40">Analyzing your image…</p>
              <div className="h-32 animate-pulse rounded-lg bg-white/[0.06]" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-white/[0.06]" />
              <div className="h-4 w-full animate-pulse rounded bg-white/[0.06]" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-white/[0.06]" />
            </div>
          )}

          {!loading && result && (
            <>
              <div className="mb-6">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm text-white/50">Generated Prompt</span>
                  <button
                    type="button"
                    onClick={() => void copyPrompt()}
                    className="rounded-lg bg-[#dc2626] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-500"
                  >
                    Copy prompt
                  </button>
                </div>
                <pre className="max-h-[min(50vh,28rem)] overflow-y-auto whitespace-pre-wrap rounded-lg bg-black/40 p-4 font-mono text-sm leading-relaxed text-white/80">
                  {result.prompt}
                </pre>
                {copyFlash && <p className="mt-2 text-xs text-green-400">Copied</p>}
              </div>

              {result.negative_prompt ? (
                <div className="mb-6">
                  <span className="text-sm text-white/50">Negative prompt</span>
                  <p className="mt-1 text-sm text-white/60">{result.negative_prompt}</p>
                </div>
              ) : null}

              <div className="mb-6 flex flex-wrap gap-2">
                {result.category ? (
                  <span className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/60">
                    {result.category}
                  </span>
                ) : null}
                {result.visual_style ? (
                  <span className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/60">
                    {result.visual_style}
                  </span>
                ) : null}
                {result.lighting ? (
                  <span className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/60">
                    {result.lighting}
                  </span>
                ) : null}
                {result.mood ? (
                  <span className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/60">
                    {result.mood}
                  </span>
                ) : null}
                {result.composition ? (
                  <span className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/60">
                    {result.composition}
                  </span>
                ) : null}
                {result.camera ? (
                  <span className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/60">
                    {result.camera}
                  </span>
                ) : null}
              </div>

              {result.suggested_models && result.suggested_models.length > 0 ? (
                <div className="mb-6">
                  <span className="text-sm text-white/50">Best models for this style</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {result.suggested_models.map((m) => (
                      <span
                        key={m}
                        className="rounded border border-red-600/20 bg-red-600/10 px-2 py-1 text-xs text-red-400"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => onFindSimilar(result.prompt)}
                className="w-full rounded-lg border border-white/10 py-3 text-sm text-white/70 transition-colors hover:border-white/25 hover:text-white"
              >
                Find similar prompts in library →
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  )
}
