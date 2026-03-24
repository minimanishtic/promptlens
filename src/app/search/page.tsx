'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Frown, Sparkles, Filter } from 'lucide-react'
import TopNav from '@/components/TopNav'
import {
  SearchStickyFilterBar,
  SearchFilterSidebar,
  emptyPills,
  emptySidebar,
} from '@/components/SearchFilters'
import SearchResultsGrid from '@/components/SearchResultsGrid'
import ImageSlidePanel from '@/components/ImageSlidePanel'
import { supabase } from '@/lib/supabase'
import type { Generation } from '@/types/database'
import type { SemanticResult } from '@/app/api/search/route'
import {
  applySearchFilters,
  type SearchGridItem,
  type SearchPillState,
  type SearchSidebarState,
} from '@/lib/search-filter-options'
import type { SearchGlobalFilterCounts } from '@/lib/search-global-filter-counts'

const PAGE_SIZE = 50

type ListMode = 'idle' | 'trending' | 'semantic' | 'fulltext'

function mergeUnique(semantic: SemanticResult[], ft: Generation[]): SearchGridItem[] {
  const seen = new Set<string>()
  const out: SearchGridItem[] = []
  for (const r of semantic) {
    if (!seen.has(r.job_set_id)) {
      seen.add(r.job_set_id)
      out.push(r)
    }
  }
  for (const r of ft) {
    if (!seen.has(r.job_set_id)) {
      seen.add(r.job_set_id)
      out.push(r)
    }
  }
  return out
}

async function semanticSearch(
  query: string,
  opts: { category?: string | null; model?: string | null; limit?: number },
): Promise<SemanticResult[]> {
  const res = await fetch('/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      limit: opts.limit ?? PAGE_SIZE,
      threshold: 0.5,
      category: opts.category || undefined,
      model: opts.model || undefined,
    }),
  })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  const json = (await res.json()) as { results: SemanticResult[] }
  return json.results ?? []
}

async function semanticSimilar(
  jobSetId: string,
  opts: { category?: string | null; model?: string | null },
): Promise<SemanticResult[]> {
  const res = await fetch('/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      similar_job_set_id: jobSetId,
      limit: PAGE_SIZE,
      threshold: 0.45,
      category: opts.category || undefined,
      model: opts.model || undefined,
    }),
  })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  const json = (await res.json()) as { results: SemanticResult[] }
  return json.results ?? []
}

function buildFtQuery(q: string, page: number, pills: SearchPillState) {
  let query = supabase
    .from('generations')
    .select('*')
    .textSearch('prompt', q, { type: 'websearch' })
  if (pills.model) query = query.eq('model', pills.model)
  if (pills.category) query = query.eq('primary_category', pills.category)
  return query
    .order('sort_priority', { ascending: true })
    .order('views_count', { ascending: false })
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)
}

async function fullTextSearch(query: string, page: number, pills: SearchPillState): Promise<Generation[]> {
  const { data, error } = await buildFtQuery(query, page, pills)
  if (error) throw error
  return (data as Generation[]) ?? []
}

async function fetchTrending(pills: SearchPillState): Promise<Generation[]> {
  let q = supabase.from('generations').select('*')
  if (pills.model) q = q.eq('model', pills.model)
  if (pills.category) q = q.eq('primary_category', pills.category)
  const { data, error } = await q
    .order('sort_priority', { ascending: true })
    .order('views_count', { ascending: false })
    .limit(PAGE_SIZE)
  if (error) throw error
  return (data as Generation[]) ?? []
}

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const qParam = searchParams.get('q') ?? ''

  const [inputValue, setInputValue] = useState(qParam)
  const [pills, setPills] = useState<SearchPillState>(emptyPills)
  const [sidebar, setSidebar] = useState<SearchSidebarState>(emptySidebar)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false)
  const [globalFilterCounts, setGlobalFilterCounts] = useState<SearchGlobalFilterCounts | null>(null)

  const [semanticResults, setSemanticResults] = useState<SemanticResult[]>([])
  const [ftResults, setFtResults] = useState<Generation[]>([])
  const [mode, setMode] = useState<ListMode>('idle')
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [vibeMode, setVibeMode] = useState(false)
  const [vibeSnapshot, setVibeSnapshot] = useState<{
    semantic: SemanticResult[]
    ft: Generation[]
    mode: ListMode
    page: number
  } | null>(null)

  const vibeModeRef = useRef(false)
  useEffect(() => {
    vibeModeRef.current = vibeMode
  }, [vibeMode])

  const [panelOpen, setPanelOpen] = useState(false)
  const [panelIndex, setPanelIndex] = useState(0)
  /** Prepended row when similar strip picks an image outside the filtered grid */
  const [panelLeadItem, setPanelLeadItem] = useState<Generation | null>(null)

  const pageRef = useRef(0)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setInputValue(qParam)
  }, [qParam])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch('/api/search/filter-counts')
        const json = (await res.json()) as { counts?: SearchGlobalFilterCounts }
        if (!cancelled && json.counts) setGlobalFilterCounts(json.counts)
      } catch {
        /* ignore */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const runMainFetch = useCallback(async () => {
    if (vibeModeRef.current) return

    const q = qParam.trim()
    setLoading(true)
    setSemanticResults([])
    setFtResults([])
    setHasMore(false)
    pageRef.current = 0

    try {
      if (!q) {
        const rows = await fetchTrending(pills)
        setFtResults(rows)
        setMode('trending')
        setLoading(false)
        return
      }

      try {
        const semResults = await semanticSearch(q, { category: pills.category, model: pills.model, limit: PAGE_SIZE })
        if (semResults.length > 0) {
          setSemanticResults(semResults)
          setMode('semantic')
          setHasMore(true)
          setLoading(false)
          return
        }
      } catch (err) {
        console.warn('Semantic search failed, using full-text:', err)
      }

      const rows = await fullTextSearch(q, 0, pills)
      setFtResults(rows)
      setMode('fulltext')
      setHasMore(rows.length === PAGE_SIZE)
    } catch (err) {
      console.error(err)
      setMode('idle')
    }

    setLoading(false)
  }, [qParam, pills.model, pills.category])

  useEffect(() => {
    void runMainFetch()
  }, [runMainFetch])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || vibeModeRef.current) return
    const q = qParam.trim()
    if (!q) return

    setLoadingMore(true)
    pageRef.current += 1
    try {
      const rows = await fullTextSearch(q, pageRef.current, pills)
      if (rows.length > 0) {
        setFtResults((prev) => [...prev, ...rows])
        setMode((m) => (m === 'semantic' ? 'fulltext' : m))
      }
      setHasMore(rows.length === PAGE_SIZE)
    } catch (e) {
      console.error(e)
      setHasMore(false)
    }
    setLoadingMore(false)
  }, [loadingMore, hasMore, qParam, pills])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loadingMore && !loading && qParam.trim() && !vibeModeRef.current) {
          void loadMore()
        }
      },
      { rootMargin: '400px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, loading, qParam, loadMore])

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

  const baseResults = useMemo(() => mergeUnique(semanticResults, ftResults), [semanticResults, ftResults])
  const filteredItems = useMemo(() => applySearchFilters(baseResults, pills, sidebar), [baseResults, pills, sidebar])

  const sidebarOnlyCount = useMemo(
    () =>
      sidebar.visual_style.length +
      sidebar.lighting.length +
      sidebar.mood.length +
      sidebar.composition.length +
      sidebar.camera_simulation.length,
    [sidebar],
  )

  const pillCount = useMemo(() => {
    let n = 0
    if (pills.model) n++
    if (pills.category) n++
    if (pills.aspect_ratio) n++
    if (pills.visual_style) n++
    return n
  }, [pills])

  const totalActiveFilterCount = pillCount + sidebarOnlyCount

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (vibeMode) {
      setVibeMode(false)
      setVibeSnapshot(null)
    }
    const next = inputValue.trim()
    router.replace(next ? `/search?q=${encodeURIComponent(next)}` : '/search')
  }

  const clearAllFilters = () => {
    setPills(emptyPills)
    setSidebar(emptySidebar)
  }

  const onTagFilter = (filter: 'primary_category' | 'visual_style' | 'lighting' | 'mood', value: string) => {
    if (filter === 'primary_category') setPills((p) => ({ ...p, category: value }))
    else if (filter === 'visual_style') setPills((p) => ({ ...p, visual_style: value }))
    else if (filter === 'lighting')
      setSidebar((s) => ({
        ...s,
        lighting: s.lighting.includes(value) ? s.lighting : [...s.lighting, value],
      }))
    else if (filter === 'mood')
      setSidebar((s) => ({
        ...s,
        mood: s.mood.includes(value) ? s.mood : [...s.mood, value],
      }))
  }

  const handleMoreLikeThis = async (item: SearchGridItem) => {
    setVibeSnapshot({ semantic: semanticResults, ft: ftResults, mode, page: pageRef.current })
    setVibeMode(true)
    setLoading(true)
    setHasMore(false)
    try {
      const results = await semanticSimilar(item.job_set_id, { category: pills.category, model: pills.model })
      setSemanticResults(results)
      setFtResults([])
      setMode('semantic')
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  const exitVibe = () => {
    if (vibeSnapshot) {
      setSemanticResults(vibeSnapshot.semantic)
      setFtResults(vibeSnapshot.ft)
      setMode(vibeSnapshot.mode)
      pageRef.current = vibeSnapshot.page
    }
    setVibeMode(false)
    setVibeSnapshot(null)
  }

  const flatForPanel = filteredItems
  const panelFlatItems = useMemo(() => {
    if (!panelLeadItem) return flatForPanel
    if (flatForPanel.some((x) => x.job_set_id === panelLeadItem.job_set_id)) return flatForPanel
    return [panelLeadItem, ...flatForPanel]
  }, [flatForPanel, panelLeadItem])

  const displayedGen = panelOpen ? panelFlatItems[panelIndex] ?? null : null

  const openPanel = (item: SearchGridItem) => {
    setPanelLeadItem(null)
    const idx = filteredItems.findIndex((x) => x.job_set_id === item.job_set_id)
    setPanelIndex(idx >= 0 ? idx : 0)
    setPanelOpen(true)
  }

  const showTrendingHint = !qParam.trim() && !vibeMode

  return (
    <div className="flex min-h-screen flex-col bg-[#0A0A0A] text-white">
      <TopNav />
      <SearchStickyFilterBar
        inputValue={inputValue}
        setInputValue={setInputValue}
        onSearchSubmit={handleSearchSubmit}
        inputRef={inputRef}
        pills={pills}
        setPills={setPills}
        showClearAll={totalActiveFilterCount > 0}
        onClearAll={clearAllFilters}
        onOpenMobileFilters={() => setMobileFiltersOpen(true)}
        mobileActiveCount={totalActiveFilterCount}
      />

      <div className="flex min-h-0 flex-1">
        {!desktopSidebarCollapsed && (
          <aside className="scrollbar-thin hidden w-[240px] shrink-0 flex-col border-r border-white/[0.06] bg-[rgba(255,255,255,0.02)] lg:flex">
            <SearchFilterSidebar
              variant="desktop"
              sidebar={sidebar}
              setSidebar={setSidebar}
              globalCounts={globalFilterCounts}
              activeFilterCount={sidebarOnlyCount}
              onToggleDesktopCollapse={() => setDesktopSidebarCollapsed(true)}
            />
          </aside>
        )}
        {desktopSidebarCollapsed && (
          <button
            type="button"
            onClick={() => setDesktopSidebarCollapsed(false)}
            className="hidden w-11 shrink-0 flex-col items-center gap-1 border-r border-white/[0.06] bg-[rgba(255,255,255,0.02)] py-4 text-white/50 transition-colors hover:bg-white/[0.04] hover:text-white/80 lg:flex"
            title="Show filters"
          >
            <Filter className="h-4 w-4" />
            {totalActiveFilterCount > 0 && (
              <span className="rounded-full bg-red-600/30 px-1.5 text-[10px] text-red-200">{totalActiveFilterCount}</span>
            )}
            <span className="text-[10px] leading-tight">Filters</span>
          </button>
        )}

        <div className="min-w-0 flex-1">
          {showTrendingHint && (
            <p className="border-b border-white/[0.04] px-4 py-2 text-center text-xs text-white/40">
              Editor&apos;s picks — originals first by sort priority
            </p>
          )}
          {qParam.trim() && !vibeMode && mode === 'semantic' && (
            <p className="flex items-center justify-center gap-2 border-b border-white/[0.04] px-4 py-2 text-xs text-white/50">
              <Sparkles className="h-3.5 w-3.5 text-red-400/80" />
              Semantic results for &ldquo;{qParam}&rdquo;
            </p>
          )}

          <SearchResultsGrid
            items={filteredItems}
            loading={loading}
            loadingMore={loadingMore}
            onOpenCard={openPanel}
            onTagFilter={onTagFilter}
            onMoreLikeThis={handleMoreLikeThis}
            sentinelRef={sentinelRef}
            vibeMode={vibeMode}
            onExitVibe={exitVibe}
          />

          {!loading && filteredItems.length === 0 && baseResults.length > 0 && (
            <div className="px-4 pb-8 text-center text-sm text-white/45">Adjust filters to see more results.</div>
          )}

          {!loading && baseResults.length === 0 && qParam.trim() && (
            <div className="flex flex-col items-center py-24 text-center">
              <Frown className="mb-4 h-12 w-12 text-white/20" />
              <p className="text-white/70">No results</p>
              <a href="/browse" className="mt-4 text-sm text-red-300/90 hover:text-red-200">
                Browse all
              </a>
            </div>
          )}

          {!loading && baseResults.length === 0 && !qParam.trim() && !vibeMode && (
            <div className="flex flex-col items-center py-16 text-center text-sm text-white/40">
              Nothing to show yet. Try a search above.
            </div>
          )}
        </div>
      </div>

      {mobileFiltersOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            aria-label="Close filters"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-[min(100vw,280px)] flex-col border-r border-white/[0.06] bg-[#0f0f0f] lg:hidden">
            <SearchFilterSidebar
              variant="mobile"
              sidebar={sidebar}
              setSidebar={setSidebar}
              globalCounts={globalFilterCounts}
              activeFilterCount={sidebarOnlyCount}
              onCloseMobile={() => setMobileFiltersOpen(false)}
            />
          </aside>
        </>
      )}

      <ImageSlidePanel
        open={panelOpen}
        gen={displayedGen}
        onClose={() => {
          setPanelOpen(false)
          setPanelLeadItem(null)
        }}
        flatItems={panelFlatItems}
        index={panelIndex}
        onNavigate={setPanelIndex}
        onPickSimilar={(g) => {
          const i = flatForPanel.findIndex((x) => x.job_set_id === g.job_set_id)
          if (i >= 0) {
            setPanelLeadItem(null)
            setPanelIndex(i)
          } else {
            setPanelLeadItem(g)
            setPanelIndex(0)
          }
        }}
      />
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A]">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  )
}
