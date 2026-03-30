'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { logEvent } from '@/lib/analytics'

interface Props {
  prompt: string
  generationId?: string
  model?: string | null
}

export default function CopyPromptButton({ prompt, generationId, model }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt)
      if (generationId) {
        void logEvent('copy', {
          generation_id: generationId,
          ...(model != null ? { model } : {}),
        })
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const el = document.createElement('textarea')
      el.value = prompt
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      if (generationId) {
        void logEvent('copy', {
          generation_id: generationId,
          ...(model != null ? { model } : {}),
        })
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={() => void handleCopy()}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shrink-0
        ${copied
          ? 'bg-green-600/20 text-green-400 border border-green-600/40'
          : 'bg-sky-500 hover:bg-sky-400 text-white border border-transparent'
        }`}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          Copy Prompt
        </>
      )}
    </button>
  )
}
