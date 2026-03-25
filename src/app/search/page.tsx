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
  applySearchFiltersToQuery,
  type SearchGridItem,
  type SearchPillState,
  type SearchSidebarState,
} from '@/lib/search-filter-options'
import type { SearchGlobalFilterCounts } from '@/lib/search-global-filter-counts'

const PAGE_SIZE = 50

type DataSource = 'trending' | 'semantic' | 'fulltext'

function buildSearchPostBody(
  pills: SearchPillState,
  sidebar: SearchSidebarState,
  opts: {
    query?: string
    similar_job_set_id?: string
    offset?: number
    limit?: number
    threshold?: number
  },
) {
  return {
    ...(opts.query ? { query: opts.query } : {}),
    ...(opts.similar_job_set_id ? { similar_job_set_id: opts.similar_job_set_id } : {}),
    ...(opts.threshold != null ? { threshold: opts.threshold } : {}),
    model: pills.model ?? undefined,
    category: pills.category ?? undefined,
    aspect_ratio: pills.aspect_ratio ?? undefined,
    visual_style: pills.visual_style ?? undefined,
    sidebar_visual_style: sidebar.visual_style,
    sidebar_lighting: sidebar.lighting,
    sidebar_mood: sidebar.mood,
    sidebar_composition: sidebar.composition,
    sidebar_camera_simulation: sidebar.camera_simulation,
    offset: opts.offset ?? 0,
    limit: opts.limit ?? PAGE_SIZE,
  }
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

  const [items, setItems] = useState<SearchGridItem[]>([])
  const [dataSource, setDataSource] = useState<DataSource>('trending')
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)

  const [vibeMode, setVibeMode] = useState(false)
  const [vibeSnapshot, setVibeSnapshot] = useState<{
    items: SearchGridItem[]
    dataSource: DataSource
    hasMore: boolean
  } | null>(null)

  const vibeModeRef = useRef(false)
  useEffect(() => {
    vibeModeRef.current = vibeMode
  }, [vibeMode])

  const [panelOpen, setPanelOpen] = useState(false)
  const [panelIndex, setPanelIndex] = useState(0)
  const [panelLeadItem, setPanelLeadItem] = useState<Generation | null>(null)

  const sentinelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  /** Bumps on each main list fetch so stale responses and in-flight loadMore cannot overwrite. */
  const mainListGenRef = useRef(0)
  const vibeFetchIdRef = useRef(0)

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

    const gen = ++mainListGenRef.current
    setLoading(true)
    setItems([])
    setHasMore(false)

    try {
      if (!qParam.trim()) {
        let q = applySearchFiltersToQuery(supabase.from('generations').select('*'), pills, sidebar)
        const { data, error } = await q
          .order('sort_priority', { ascending: true })
          .order('views_count', { ascending: false })
          .range(0, PAGE_SIZE - 1)
        if (error) throw error
        if (gen !== mainListGenRef.current) return
        const rows = (data as Generation[]) ?? []
        setItems(rows)
        setHasMore(rows.length === PAGE_SIZE)
        setDataSource('trending')
        return
      }

      const semRes = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          buildSearchPostBody(pills, sidebar, { query: qParam.trim(), offset: 0, limit: PAGE_SIZE }),
        ),
      })
      const semJson = (await semRes.json()) as {
        results?: SemanticResult[]
        hasMore?: boolean
        error?: string
      }
      if (!semRes.ok) throw new Error(semJson.error || `API ${semRes.status}`)
      if (gen !== mainListGenRef.current) return

      if (semJson.results && semJson.results.length > 0) {
        setItems(semJson.results)
        setHasMore(!!semJson.hasMore)
        setDataSource('semantic')
        return
      }

      let fq = supabase
        .from('generations')
        .select('*')
        .textSearch('prompt', qParam.trim(), { type: 'websearch' })
      fq = applySearchFiltersToQuery(fq, pills, sidebar)
      const { data: ftData, error: ftErr } = await fq
        .order('sort_priority', { ascending: true })
        .order('views_count', { ascending: false })
        .range(0, PAGE_SIZE - 1)
      if (ftErr) throw ftErr
      if (gen !== mainListGenRef.current) return
      const ftRows = (ftData as Generation[]) ?? []
      setItems(ftRows)
      setHasMore(ftRows.length === PAGE_SIZE)
      setDataSource('fulltext')
    } catch (err) {
      console.error(err)
      if (gen === mainListGenRef.current) {
        setItems([])
        setDataSource('trending')
      }
    } finally {
      if (gen === mainListGenRef.current) setLoading(false)
    }
  }, [qParam, pills, sidebar])

  useEffect(() => {
    void runMainFetch()
  }, [runMainFetch])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || vibeModeRef.current) return

    const listGen = mainListGenRef.current

    if (!qParam.trim()) {
      setLoadingMore(true)
      try {
        const offset = items.length
        let q = applySearchFiltersToQuery(supabase.from('generations').select('*'), pills, sidebar)
        const { data, error } = await q
          .order('sort_priority', { ascending: true })
          .order('views_count', { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1)
        if (error) throw error
        if (listGen !== mainListGenRef.current) return
        const rows = (data as Generation[]) ?? []
        if (rows.length > 0) setItems((prev) => [...prev, ...rows])
        setHasMore(rows.length === PAGE_SIZE)
      } catch (e) {
        console.error(e)
        if (listGen === mainListGenRef.current) setHasMore(false)
      } finally {
        setLoadingMore(false)
      }
      return
    }

    if (dataSource === 'semantic') {
      setLoadingMore(true)
      try {
        const res = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            buildSearchPostBody(pills, sidebar, {
              query: qParam.trim(),
              offset: items.length,
              limit: PAGE_SIZE,
            }),
          ),
        })
        const json = (await res.json()) as { results?: SemanticResult[]; hasMore?: boolean }
        if (listGen !== mainListGenRef.current) return
        const next = json.results ?? []
        if (next.length > 0) setItems((prev) => [...prev, ...next])
        setHasMore(!!json.hasMore)
      } catch (e) {
        console.error(e)
        if (listGen === mainListGenRef.current) setHasMore(false)
      } finally {
        setLoadingMore(false)
      }
      return
    }

    setLoadingMore(true)
    try {
      const offset = items.length
      let q = supabase
        .from('generations')
        .select('*')
        .textSearch('prompt', qParam.trim(), { type: 'websearch' })
      q = applySearchFiltersToQuery(q, pills, sidebar)
      const { data, error } = await q
        .order('sort_priority', { ascending: true })
        .order('views_count', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1)
      if (error) throw error
      if (listGen !== mainListGenRef.current) return
      const rows = (data as Generation[]) ?? []
      if (rows.length > 0) setItems((prev) => [...prev, ...rows])
      setHasMore(rows.length === PAGE_SIZE)
    } catch (e) {
      console.error(e)
      if (listGen === mainListGenRef.current) setHasMore(false)
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, hasMore, qParam, pills, sidebar, dataSource, items.length])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loadingMore && !loading && !vibeModeRef.current) {
          void loadMore()
        }
      },
      { rootMargin: '400px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, loading, loadMore])

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
    const vf = ++vibeFetchIdRef.current
    setVibeSnapshot({ items: [...items], dataSource, hasMore })
    setVibeMode(true)
    setLoading(true)
    setItems([])
    setHasMore(false)
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          buildSearchPostBody(pills, sidebar, {
            similar_job_set_id: item.job_set_id,
            offset: 0,
            limit: PAGE_SIZE,
            threshold: 0.45,
          }),
        ),
      })
      const json = (await res.json()) as { results?: SemanticResult[]; hasMore?: boolean; error?: string }
      if (!res.ok) throw new Error(json.error || String(res.status))
      if (vf !== vibeFetchIdRef.current) return
      setItems(json.results ?? [])
      setHasMore(!!json.hasMore)
      setDataSource('semantic')
    } catch (err) {
      console.error(err)
    } finally {
      if (vf === vibeFetchIdRef.current) setLoading(false)
    }
  }

  const exitVibe = () => {
    if (vibeSnapshot) {
      setItems(vibeSnapshot.items)
      setDataSource(vibeSnapshot.dataSource)
      setHasMore(vibeSnapshot.hasMore)
    }
    setVibeMode(false)
    setVibeSnapshot(null)
  }

  const flatForPanel = items
  const panelFlatItems = useMemo(() => {
    if (!panelLeadItem) return flatForPanel
    if (flatForPanel.some((x) => x.job_set_id === panelLeadItem.job_set_id)) return flatForPanel
    return [panelLeadItem, ...flatForPanel]
  }, [flatForPanel, panelLeadItem])

  const displayedGen = panelOpen ? panelFlatItems[panelIndex] ?? null : null

  const openPanel = (item: SearchGridItem) => {
    setPanelLeadItem(null)
    const idx = items.findIndex((x) => x.job_set_id === item.job_set_id)
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
        globalCounts={globalFilterCounts}
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
          {qParam.trim() && !vibeMode && dataSource === 'semantic' && (
            <p className="flex items-center justify-center gap-2 border-b border-white/[0.04] px-4 py-2 text-xs text-white/50">
              <Sparkles className="h-3.5 w-3.5 text-red-400/80" />
              Semantic results for &ldquo;{qParam}&rdquo;
            </p>
          )}

          <SearchResultsGrid
            items={items}
            loading={loading}
            loadingMore={loadingMore}
            onOpenCard={openPanel}
            onTagFilter={onTagFilter}
            onMoreLikeThis={handleMoreLikeThis}
            sentinelRef={sentinelRef}
            vibeMode={vibeMode}
            onExitVibe={exitVibe}
          />

          {!loading && items.length === 0 && qParam.trim() && (
            <div className="flex flex-col items-center py-24 text-center">
              <Frown className="mb-4 h-12 w-12 text-white/20" />
              <p className="text-white/70">No results</p>
              <a href="/browse" className="mt-4 text-sm text-red-300/90 hover:text-red-200">
                Browse all
              </a>
            </div>
          )}

          {!loading && items.length === 0 && !qParam.trim() && !vibeMode && (
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
