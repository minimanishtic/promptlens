'use client'

import { useCallback, useEffect, useRef, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, ArrowLeft, Frown, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Generation } from '@/types/database'
import type { SemanticResult } from '@/app/api/search/route'
import ImageCard from '@/components/ImageCard'
import SemanticImageCard from '@/components/SemanticImageCard'
import { NavAuthButton } from '@/components/UserMenu'
import ImageCardSkeleton from '@/components/ImageCardSkeleton'

const PAGE_SIZE = 24
const GRID_SIZES = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw'

type SearchMode = 'semantic' | 'fulltext' | 'idle'

async function semanticSearch(query: string): Promise<SemanticResult[]> {
  const res = await fetch('/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, limit: PAGE_SIZE, threshold: 0.5 }),
  })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  const json = await res.json() as { results: SemanticResult[] }
  return json.results ?? []
}

async function fullTextSearch(query: string, page: number): Promise<Generation[]> {
  const { data, error } = await supabase
    .from('generations')
    .select('*')
    .textSearch('prompt', query, { type: 'websearch' })
    .order('views_count', { ascending: false })
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)
  if (error) throw error
  return (data as Generation[]) ?? []
}

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialQuery = searchParams.get('q') ?? ''

  const [inputValue, setInputValue] = useState(initialQuery)
  const [query, setQuery] = useState(initialQuery)

  // Semantic results
  const [semanticResults, setSemanticResults] = useState<SemanticResult[]>([])
  // Full-text fallback results
  const [ftResults, setFtResults] = useState<Generation[]>([])

  const [mode, setMode] = useState<SearchMode>('idle')
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [totalHint, setTotalHint] = useState<number | null>(null)

  const pageRef = useRef(0)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // "/" shortcut
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

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSemanticResults([])
      setFtResults([])
      setMode('idle')
      setHasMore(false)
      setTotalHint(null)
      return
    }

    setLoading(true)
    setSemanticResults([])
    setFtResults([])
    setHasMore(false)
    setTotalHint(null)
    pageRef.current = 0

    // 1. Try semantic search first
    try {
      const semResults = await semanticSearch(q)
      if (semResults.length > 0) {
        setSemanticResults(semResults)
        setMode('semantic')
        setTotalHint(semResults.length)
        // Semantic results are one page only — load more falls back to full-text
        setHasMore(true)
        setLoading(false)
        return
      }
    } catch (err) {
      console.warn('Semantic search unavailable, falling back:', err)
    }

    // 2. Fall back to full-text search
    try {
      const rows = await fullTextSearch(q, 0)
      setFtResults(rows)
      setMode('fulltext')
      setHasMore(rows.length === PAGE_SIZE)
      setTotalHint(rows.length < PAGE_SIZE ? rows.length : null)

      if (rows.length === PAGE_SIZE) {
        supabase
          .from('generations')
          .select('id', { count: 'exact', head: true })
          .textSearch('prompt', q, { type: 'websearch' })
          .then(({ count }) => { if (count != null) setTotalHint(count) })
      }
    } catch (err) {
      console.error('Full-text search failed:', err)
    }

    setLoading(false)
  }, [])

  const loadMore = useCallback(async (q: string) => {
    if (loadingMore) return
    setLoadingMore(true)
    pageRef.current += 1

    // More pages always use full-text (semantic is one-shot)
    try {
      const rows = await fullTextSearch(q, pageRef.current)
      setFtResults((prev) => [...prev, ...rows])
      // If we were in semantic mode, switch to hybrid label for subsequent pages
      if (mode === 'semantic') setMode('fulltext')
      setHasMore(rows.length === PAGE_SIZE)
    } catch (err) {
      console.error('Load more failed:', err)
    }

    setLoadingMore(false)
  }, [loadingMore, mode])

  // Run on query change
  useEffect(() => {
    runSearch(query)
  }, [query, runSearch])

  // Infinite scroll — only after semantic page shown
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading && mode !== 'idle') {
          loadMore(query)
        }
      },
      { rootMargin: '400px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, loading, query, mode, loadMore])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = inputValue.trim()
    if (!q || q === query) return
    router.replace(`/search?q=${encodeURIComponent(q)}`)
    setQuery(q)
  }

  const searched = query.trim().length > 0
  const done = !loading && searched
  const isSemantic = mode === 'semantic'

  // Combined display list
  const allImages: (SemanticResult | Generation)[] = isSemantic
    ? [...semanticResults, ...ftResults]
    : ftResults
  const totalCount = allImages.length

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center gap-4">
          <a href="/" className="text-lg font-bold text-white shrink-0">
            Prompt<span className="text-violet-500">Lens</span>
          </a>
          <span className="text-zinc-700 hidden sm:block">|</span>
          <nav className="hidden sm:flex items-center gap-4 text-sm text-zinc-400">
            <a href="/browse" className="hover:text-white transition-colors">Browse</a>
            <a href="/glossary" className="hover:text-white transition-colors">Glossary</a>
            <a href="/analytics" className="hover:text-white transition-colors">Analytics</a>
            <a href="/templates" className="hover:text-white transition-colors">Templates</a>
            <a href="/builder" className="hover:text-white transition-colors">Builder</a>
            <a href="/library" className="hover:text-white transition-colors">Library</a>
          </nav>
          <div className="ml-auto">
            <NavAuthButton />
          </div>
          <a
            href="/browse"
            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors sm:hidden"
          >
            <ArrowLeft className="w-4 h-4" />
            Browse
          </a>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-4 py-8 w-full flex-1 flex flex-col">
        {/* Search bar */}
        <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto mb-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-violet-400 transition-colors pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Search prompts... e.g. woman in golden hour with bokeh"
              autoFocus
              className="w-full bg-zinc-900 border border-zinc-700 focus:border-violet-500 text-white placeholder-zinc-500 rounded-xl pl-12 pr-28 py-4 text-sm outline-none transition-colors focus:ring-2 focus:ring-violet-500/20"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        {/* Result meta row */}
        {done && totalCount > 0 && (
          <div className="flex items-center gap-3 mb-5">
            {isSemantic && (
              <span className="flex items-center gap-1.5 text-xs bg-violet-600/15 text-violet-300 border border-violet-600/30 rounded-full px-3 py-1">
                <Sparkles className="w-3 h-3" />
                Semantic search
              </span>
            )}
            <p className="text-sm text-zinc-500">
              {totalHint != null ? (
                <>
                  <span className="text-white font-medium">{totalHint.toLocaleString()}</span>{' '}
                  result{totalHint !== 1 ? 's' : ''} for{' '}
                </>
              ) : (
                <>Showing results for </>
              )}
              <span className="text-violet-400">&ldquo;{query}&rdquo;</span>
            </p>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
            {Array.from({ length: 24 }).map((_, i) => (
              <ImageCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {done && totalCount === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-center flex-1">
            <Frown className="w-12 h-12 text-zinc-700 mb-4" />
            <p className="text-zinc-300 text-lg font-medium mb-2">No results found</p>
            <p className="text-zinc-500 text-sm mb-6">
              Nothing matched{' '}
              <span className="text-violet-400">&ldquo;{query}&rdquo;</span>.
              Try different or simpler keywords.
            </p>
            <div className="flex gap-3">
              <a
                href="/browse"
                className="text-sm bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Browse all images
              </a>
              <button
                onClick={() => { setInputValue(''); setQuery('') }}
                className="text-sm border border-zinc-700 hover:border-zinc-500 text-zinc-300 px-4 py-2 rounded-lg transition-colors"
              >
                Clear search
              </button>
            </div>
          </div>
        )}

        {/* Results grid */}
        {!loading && totalCount > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {/* Semantic results */}
              {semanticResults.map((result, i) => (
                <SemanticImageCard
                  key={`sem-${result.id}`}
                  result={result}
                  priority={i < 6}
                  sizes={GRID_SIZES}
                />
              ))}
              {/* Full-text fallback / load-more results */}
              {ftResults.map((image, i) => (
                <ImageCard
                  key={`ft-${image.id}`}
                  image={image}
                  priority={semanticResults.length === 0 && i < 6}
                  sizes={GRID_SIZES}
                />
              ))}
              {loadingMore &&
                Array.from({ length: 6 }).map((_, i) => (
                  <ImageCardSkeleton key={`more-${i}`} />
                ))}
            </div>

            <div ref={sentinelRef} className="h-1" />

            {!hasMore && (
              <p className="text-center text-zinc-600 text-sm py-10">
                {totalCount.toLocaleString()} results &middot; end of results
              </p>
            )}
          </>
        )}

        {/* No query yet */}
        {!searched && !loading && (
          <div className="flex flex-col items-center justify-center py-32 text-center flex-1">
            <div className="w-14 h-14 rounded-full bg-violet-600/10 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-violet-400" />
            </div>
            <p className="text-zinc-300 text-sm font-medium mb-1">Semantic search powered by AI</p>
            <p className="text-zinc-600 text-xs">
              Try natural language: &ldquo;dark moody product shot on marble&rdquo;
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
