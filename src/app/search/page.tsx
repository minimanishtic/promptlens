'use client'

import { useCallback, useEffect, useRef, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, ArrowLeft, Frown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Generation } from '@/types/database'
import ImageCard from '@/components/ImageCard'
import ImageCardSkeleton from '@/components/ImageCardSkeleton'

const PAGE_SIZE = 24

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialQuery = searchParams.get('q') ?? ''

  const [inputValue, setInputValue] = useState(initialQuery)
  const [query, setQuery] = useState(initialQuery)
  const [images, setImages] = useState<Generation[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [totalHint, setTotalHint] = useState<number | null>(null)
  const pageRef = useRef(0)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchResults = useCallback(async (q: string, page: number, replace: boolean) => {
    if (!q.trim()) {
      setImages([])
      setHasMore(false)
      setTotalHint(null)
      setLoading(false)
      return
    }

    // Cancel any in-flight request
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    if (page === 0) setLoading(true)
    else setLoadingMore(true)

    const { data, error } = await supabase
      .from('generations')
      .select('*')
      .textSearch('prompt', q, { type: 'websearch' })
      .order('views_count', { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)

    if (error) {
      setLoading(false)
      setLoadingMore(false)
      return
    }

    const rows = (data as Generation[]) ?? []
    setImages((prev) => (replace ? rows : [...prev, ...rows]))
    setHasMore(rows.length === PAGE_SIZE)

    // Rough total hint: if first page is full, count
    if (page === 0) {
      setTotalHint(rows.length < PAGE_SIZE ? rows.length : null)
      if (rows.length === PAGE_SIZE) {
        supabase
          .from('generations')
          .select('id', { count: 'exact', head: true })
          .textSearch('prompt', q, { type: 'websearch' })
          .then(({ count }) => {
            if (count != null) setTotalHint(count)
          })
      }
    }

    setLoading(false)
    setLoadingMore(false)
  }, [])

  // Run search when query changes
  useEffect(() => {
    pageRef.current = 0
    fetchResults(query, 0, true)
  }, [query, fetchResults])

  // Infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          pageRef.current += 1
          fetchResults(query, pageRef.current, false)
        }
      },
      { rootMargin: '400px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, loading, query, fetchResults])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = inputValue.trim()
    if (!q || q === query) return
    router.replace(`/search?q=${encodeURIComponent(q)}`)
    setQuery(q)
  }

  const searched = query.trim().length > 0
  const done = !loading && searched

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center gap-4">
          <a href="/" className="text-lg font-bold text-white shrink-0">
            Prompt<span className="text-violet-500">Lens</span>
          </a>
          <span className="text-zinc-700">|</span>
          <a
            href="/browse"
            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Browse
          </a>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-4 py-8 w-full flex-1 flex flex-col">
        {/* Search bar */}
        <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto mb-8">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-violet-400 transition-colors" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Search prompts…"
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

        {/* Result count */}
        {done && images.length > 0 && (
          <p className="text-sm text-zinc-500 mb-5">
            {totalHint != null ? (
              <>
                <span className="text-white font-medium">{totalHint.toLocaleString()}</span>{' '}
                result{totalHint !== 1 ? 's' : ''} for{' '}
                <span className="text-violet-400">&ldquo;{query}&rdquo;</span>
              </>
            ) : (
              <>
                Showing results for{' '}
                <span className="text-violet-400">&ldquo;{query}&rdquo;</span>
              </>
            )}
          </p>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {Array.from({ length: 24 }).map((_, i) => (
              <ImageCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {done && images.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-center flex-1">
            <Frown className="w-12 h-12 text-zinc-700 mb-4" />
            <p className="text-zinc-300 text-lg font-medium mb-2">No results found</p>
            <p className="text-zinc-500 text-sm mb-6">
              No prompts matched{' '}
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
        {!loading && images.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {images.map((image) => (
                <ImageCard key={image.id} image={image} />
              ))}
              {loadingMore &&
                Array.from({ length: 6 }).map((_, i) => (
                  <ImageCardSkeleton key={`more-${i}`} />
                ))}
            </div>

            {/* Sentinel */}
            <div ref={sentinelRef} className="h-1" />

            {!hasMore && (
              <p className="text-center text-zinc-600 text-sm py-10">
                {images.length.toLocaleString()} results loaded &middot; end of results
              </p>
            )}
          </>
        )}

        {/* No query yet */}
        {!searched && !loading && (
          <div className="flex flex-col items-center justify-center py-32 text-center flex-1">
            <Search className="w-10 h-10 text-zinc-700 mb-4" />
            <p className="text-zinc-500 text-sm">Type a prompt keyword above to search</p>
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
