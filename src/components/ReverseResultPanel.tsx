'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  formatForModel,
  MODELS,
  type ModelId,
  type ReverseResult,
} from '@/lib/prompt-formatters'
import { logEvent } from '@/lib/analytics'

export interface ReverseResultPanelProps {
  open: boolean
  onClose: () => void
  previewUrl: string | null
  isLoading: boolean
  result: ReverseResult | null
  error: string | null
  onSearchWithPrompt: (prompt: string) => void
}

const ELEMENT_CONFIG = [
  { key: 'subject', label: 'Subject', color: 'bg-blue-500/10 border-blue-500/20' },
  { key: 'action_pose', label: 'Action / Pose', color: 'bg-purple-500/10 border-purple-500/20' },
  { key: 'setting', label: 'Setting', color: 'bg-green-500/10 border-green-500/20' },
  { key: 'lighting', label: 'Lighting', color: 'bg-yellow-500/10 border-yellow-500/20' },
  { key: 'composition', label: 'Composition', color: 'bg-orange-500/10 border-orange-500/20' },
  { key: 'style', label: 'Style', color: 'bg-pink-500/10 border-pink-500/20' },
  { key: 'mood', label: 'Mood', color: 'bg-cyan-500/10 border-cyan-500/20' },
  { key: 'technical', label: 'Technical', color: 'bg-red-500/10 border-red-500/20' },
] as const

function RecipeSkeleton() {
  return (
    <div className="space-y-1.5">
      {ELEMENT_CONFIG.map(({ key }) => (
        <div
          key={key}
          className="animate-pulse rounded-lg border border-white/10 bg-white/[0.06] p-3"
        >
          <div className="mb-2 h-2.5 w-16 rounded bg-white/10" />
          <div className="h-3 w-full rounded bg-white/[0.08]" />
          <div className="mt-1.5 h-3 w-[92%] rounded bg-white/[0.06]" />
        </div>
      ))}
    </div>
  )
}

export default function ReverseResultPanel({
  open,
  onClose,
  previewUrl,
  isLoading,
  result,
  error,
  onSearchWithPrompt,
}: ReverseResultPanelProps) {
  const [selectedModel, setSelectedModel] = useState<ModelId>('flux')
  const [copiedPrompt, setCopiedPrompt] = useState(false)
  const [copiedNegative, setCopiedNegative] = useState(false)
  const reverseLoggedKeyRef = useRef<string | null>(null)

  const modelInfo = MODELS.find((m) => m.id === selectedModel)!
  const formattedPrompt = result ? formatForModel(selectedModel, result.elements) : ''

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

  useEffect(() => {
    if (!open) {
      reverseLoggedKeyRef.current = null
      return
    }
    if (isLoading || !result) return
    const key = previewUrl ?? `result:${result.category}`
    if (reverseLoggedKeyRef.current === key) return
    reverseLoggedKeyRef.current = key
    void logEvent('reverse_upload', { model_selected: selectedModel })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- selectedModel: snapshot at result; omit to avoid pill-change re-runs
  }, [open, isLoading, result, previewUrl])

  const copyToClipboard = useCallback(async (text: string, type: 'prompt' | 'negative') => {
    try {
      await navigator.clipboard.writeText(text)
      void logEvent('copy', {
        context: 'reverse_engineer',
        copy_type: type,
        model_selected: selectedModel,
      })
      if (type === 'prompt') {
        setCopiedPrompt(true)
        setTimeout(() => setCopiedPrompt(false), 2000)
      } else {
        setCopiedNegative(true)
        setTimeout(() => setCopiedNegative(false), 2000)
      }
    } catch {
      /* ignore */
    }
  }, [selectedModel])

  if (!open) return null

  const showRecipe = result && !isLoading
  const showFormatted = result && !isLoading

  return (
    <>
      <div className="fixed inset-0 z-[75] bg-black/60" onClick={onClose} aria-hidden />

      <div className="fixed inset-y-0 right-0 z-[80] w-full overflow-y-auto border-l border-white/10 bg-zinc-900 p-6 md:max-w-[520px]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-xl text-white/40 transition-colors hover:text-white"
          aria-label="Close"
        >
          ✕
        </button>

        <div className="mb-5 flex items-center gap-2 pr-10">
          <span className="text-xs font-semibold uppercase tracking-wider text-red-500">Reverse Engineer</span>
        </div>

        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Uploaded"
            className="mb-5 max-h-[240px] w-full rounded-lg bg-black/30 object-contain"
          />
        ) : null}

        {error ? (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-950/20 px-3 py-2 text-sm text-red-200/90">
            {error}
          </div>
        ) : null}

        <div className="mb-5">
          <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/40">Select Model</span>
          <div className="flex flex-wrap gap-1.5">
            {MODELS.map((model) => (
              <button
                key={model.id}
                type="button"
                onClick={() => setSelectedModel(model.id)}
                className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                  selectedModel === model.id
                    ? 'border-red-500 bg-red-600 text-white'
                    : 'border-white/10 bg-white/5 text-white/50 hover:border-white/20 hover:text-white/80'
                }`}
              >
                {model.name}
              </button>
            ))}
          </div>
        </div>

        {result?.category ? (
          <p className="mb-3 text-xs text-white/35">
            <span className="text-white/50">Category:</span> {result.category}
          </p>
        ) : null}

        <div className="mb-5">
          <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/40">Prompt Recipe</span>
          {isLoading && !result ? (
            <>
              <p className="mb-3 text-sm text-white/40">Analyzing your image…</p>
              <RecipeSkeleton />
            </>
          ) : showRecipe ? (
            <div className="space-y-1.5">
              {ELEMENT_CONFIG.map(({ key, label, color }) => {
                const value = result.elements[key as keyof typeof result.elements]
                if (!value?.trim()) return null
                return (
                  <div key={key} className={`rounded-lg border p-3 ${color}`}>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-white/40">{label}</span>
                    <p className="mt-0.5 text-sm leading-relaxed text-white/80">{value}</p>
                  </div>
                )
              })}
            </div>
          ) : null}
        </div>

        {showRecipe && result.color_palette && result.color_palette.length > 0 ? (
          <div className="mb-5">
            <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/40">Color Palette</span>
            <div className="flex flex-wrap gap-2">
              {result.color_palette.map((color, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div
                    className="h-10 w-10 rounded-lg border border-white/10"
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-mono text-[10px] text-white/30">{color}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-white/40">
              Formatted for: <span className="text-red-400">{modelInfo.name}</span>
            </span>
          </div>
          {isLoading && !result ? (
            <div className="relative rounded-lg border border-white/10 bg-black/40 p-4">
              <div className="min-h-[120px] animate-pulse space-y-2 pr-16">
                <div className="h-3 w-full rounded bg-white/[0.08]" />
                <div className="h-3 w-[92%] rounded bg-white/[0.06]" />
                <div className="h-3 w-[88%] rounded bg-white/[0.07]" />
                <div className="h-3 w-full rounded bg-white/[0.06]" />
              </div>
            </div>
          ) : showFormatted ? (
            <div className="relative rounded-lg border border-white/10 bg-black/40 p-4">
              <pre className="whitespace-pre-wrap pr-16 font-mono text-sm leading-relaxed text-white/80">
                {formattedPrompt}
              </pre>
              <button
                type="button"
                onClick={() => void copyToClipboard(formattedPrompt, 'prompt')}
                className="absolute right-3 top-3 rounded-lg bg-red-600 px-3 py-1.5 text-xs text-white transition-colors hover:bg-red-500"
              >
                {copiedPrompt ? 'Copied!' : 'Copy'}
              </button>
            </div>
          ) : null}
        </div>

        {showFormatted && modelInfo.supportsNegative && result.negative_prompt?.trim() ? (
          <div className="mb-4">
            <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/40">Negative Prompt</span>
            <div className="relative rounded-lg border border-white/10 bg-black/40 p-4">
              <p className="pr-16 text-sm text-white/60">{result.negative_prompt}</p>
              <button
                type="button"
                onClick={() => void copyToClipboard(result.negative_prompt, 'negative')}
                className="absolute right-3 top-3 rounded border border-white/10 px-2 py-1 text-xs text-white/40 transition-colors hover:border-white/20 hover:text-white"
              >
                {copiedNegative ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        ) : null}

        <div className="mb-5 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2.5">
          <p className="text-xs leading-relaxed text-white/30">
            <span className="font-medium text-white/50">{modelInfo.name}:</span>{' '}
            {modelInfo.promptStyle}. Ideal length: {modelInfo.idealLength}.
            {!modelInfo.supportsNegative ? ' Does not support negative prompts.' : ''}
          </p>
        </div>

        <button
          type="button"
          disabled={!result || isLoading}
          onClick={() => {
            if (!result) return
            onClose()
            onSearchWithPrompt(`${result.elements.subject} ${result.elements.style}`.trim())
          }}
          className="w-full rounded-lg border border-white/10 py-3 text-sm text-white/70 transition-colors hover:border-white/25 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Find similar prompts in library →
        </button>
      </div>
    </>
  )
}
