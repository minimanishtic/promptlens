'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

export default function HeroSearch() {
  const [query, setQuery] = useState('')
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  // "/" keyboard shortcut focuses the search bar
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-sky-400 transition-colors pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Try: woman in golden hour with bokeh, dark moody product shot..."
          className="w-full bg-zinc-900 border border-zinc-700/80 focus:border-sky-500 text-white placeholder-zinc-500 rounded-xl pl-12 pr-32 py-4 text-sm outline-none transition-colors focus:ring-2 focus:ring-sky-500/15"
        />
        <button
          type="submit"
          disabled={!query.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-950 text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
        >
          Search
        </button>
      </div>
      <p className="text-center text-xs text-zinc-600 mt-3">
        AI-powered semantic search &middot; Press{' '}
        <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono text-[10px]">/</kbd>
        {' '}to focus &middot; or{' '}
        <a href="/browse" className="text-sky-400 hover:text-sky-300 transition-colors">
          browse all images
        </a>
      </p>
    </form>
  )
}
