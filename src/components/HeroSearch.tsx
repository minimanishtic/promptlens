'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

export default function HeroSearch() {
  const [query, setQuery] = useState('')
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-violet-400 transition-colors" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={'Search prompts\u2026 e.g. \u201ccinematic portrait golden hour\u201d'}
          className="w-full bg-zinc-900 border border-zinc-700 focus:border-violet-500 text-white placeholder-zinc-500 rounded-xl pl-12 pr-32 py-4 text-sm outline-none transition-colors focus:ring-2 focus:ring-violet-500/20"
        />
        <button
          type="submit"
          disabled={!query.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
        >
          Search
        </button>
      </div>
      <p className="text-center text-xs text-zinc-600 mt-3">
        Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono text-[10px]">Enter</kbd> to search{' '}
        &middot; or{' '}
        <a href="/browse" className="text-violet-400 hover:text-violet-300 transition-colors">browse all images &rarr;</a>
      </p>
    </form>
  )
}
