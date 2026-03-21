'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useCallback } from 'react'
import { X } from 'lucide-react'

export default function ImageDetailModal({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  const onClose = useCallback(() => {
    router.back()
  }, [router])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center sm:items-center sm:py-[2.5vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Image details"
    >
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        aria-hidden
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-6xl max-h-[100dvh] sm:max-h-[95dvh] overflow-y-auto overscroll-contain mx-0 sm:mx-4 rounded-none sm:rounded-xl bg-zinc-950 border-0 sm:border border-zinc-800 shadow-2xl shadow-black/60">
        <div className="sticky top-0 z-20 flex justify-end p-3 sm:p-4 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800/80 sm:border-0 sm:bg-transparent sm:backdrop-blur-none sm:absolute sm:right-2 sm:top-2 sm:p-0">
          <button
            type="button"
            onClick={onClose}
            className="min-w-11 min-h-11 w-11 h-11 flex items-center justify-center rounded-full bg-zinc-900/95 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors shadow-lg"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="sm:pt-2">{children}</div>
      </div>
    </div>
  )
}
