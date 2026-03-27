'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
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
import ReverseResultPanel from '@/components/ReverseResultPanel'
import { normalizeReversePayload, type ReverseResult } from '@/lib/prompt-formatters'
import { resizeImage } from '@/lib/resize-image'
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

const ITEMS_PER_PAGE = 40

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
    limit: opts.limit ?? ITEMS_PER_PAGE,
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
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const [vibeMode, setVibeMode] = useState(false)
  const [vibeAnchorId, setVibeAnchorId] = useState<string | null>(null)
  const [vibeSnapshot, setVibeSnapshot] = useState<{
    items: SearchGridItem[]
    dataSource: DataSource
    totalCount: number
    currentPage: number
  } | null>(null)

  const vibeModeRef = useRef(false)
  useEffect(() => {
    vibeModeRef.current = vibeMode
  }, [vibeMode])

  const [panelOpen, setPanelOpen] = useState(false)
  const [panelIndex, setPanelIndex] = useState(0)
  const [panelLeadItem, setPanelLeadItem] = useState<Generation | null>(null)

  const [reverseOpen, setReverseOpen] = useState(false)
  const [reverseLoading, setReverseLoading] = useState(false)
  const [reverseResult, setReverseResult] = useState<ReverseResult | null>(null)
  const [reversePreview, setReversePreview] = useState<string | null>(null)
  const [reverseError, setReverseError] = useState<string | null>(null)
  const reverseFileInputRef = useRef<HTMLInputElement>(null)

  const setPillsResetPage = useCallback((action: React.SetStateAction<SearchPillState>) => {
    setCurrentPage(1)
    setPills(action)
  }, [])
  const setSidebarResetPage = useCallback((action: React.SetStateAction<SearchSidebarState>) => {
    setCurrentPage(1)
    setSidebar(action)
  }, [])

  const inputRef = useRef<HTMLInputElement>(null)
  const mainListGenRef = useRef(0)
  const vibeFetchIdRef = useRef(0)
  const builderHandoffAppliedRef = useRef(false)

  const filtersKey = useMemo(() => JSON.stringify({ q: qParam, pills, sidebar }), [qParam, pills, sidebar])
  const filtersKeyRef = useRef<string | null>(null)
  useEffect(() => {
    if (filtersKeyRef.current !== null && filtersKeyRef.current !== filtersKey) {
      setCurrentPage(1)
    }
    filtersKeyRef.current = filtersKey
  }, [filtersKey])

  useEffect(() => {
    setInputValue(qParam)
  }, [qParam])

  /** Prompt builder → search: apply filters from URL once (category, visual_style, lighting, mood, composition, model). */
  useEffect(() => {
    if (builderHandoffAppliedRef.current) return
    const cat = searchParams.get('category')
    const vs = searchParams.get('visual_style')
    const light = searchParams.get('lighting')
    const md = searchParams.get('mood')
    const comp = searchParams.get('composition')
    const mod = searchParams.get('model')
    if (!cat && !vs && !light && !md && !comp && !mod) return
    builderHandoffAppliedRef.current = true
    setCurrentPage(1)
    setPills({
      ...emptyPills,
      category: cat || null,
      visual_style: vs || null,
      model: mod || null,
    })
    setSidebar({
      ...emptySidebar,
      lighting: light ? [light] : [],
      mood: md ? [md] : [],
      composition: comp ? [comp] : [],
    })
  }, [searchParams])

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
    const offset = (currentPage - 1) * ITEMS_PER_PAGE
    setLoading(true)
    setItems([])

    try {
      if (!qParam.trim()) {
        let q = applySearchFiltersToQuery(
          supabase.from('generations').select('*', { count: 'exact' }),
          pills,
          sidebar,
        )
        const { data, error, count } = await q
          .order('sort_priority', { ascending: true })
          .order('views_count', { ascending: false })
          .range(offset, offset + ITEMS_PER_PAGE - 1)
        if (error) throw error
        if (gen !== mainListGenRef.current) return
        const rows = (data as Generation[]) ?? []
        setItems(rows)
        setTotalCount(count ?? rows.length)
        setDataSource('trending')
        return
      }

      const semRes = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          buildSearchPostBody(pills, sidebar, {
            query: qParam.trim(),
            offset,
            limit: ITEMS_PER_PAGE,
          }),
        ),
      })
      const semJson = (await semRes.json()) as {
        results?: SemanticResult[]
        totalCount?: number
        error?: string
      }
      if (!semRes.ok) throw new Error(semJson.error || `API ${semRes.status}`)
      if (gen !== mainListGenRef.current) return

      if (semJson.results && semJson.results.length > 0) {
        setItems(semJson.results)
        setTotalCount(semJson.totalCount ?? semJson.results.length)
        setDataSource('semantic')
        return
      }

      let fq = supabase
        .from('generations')
        .select('*', { count: 'exact' })
        .textSearch('prompt', qParam.trim(), { type: 'websearch' })
      fq = applySearchFiltersToQuery(fq, pills, sidebar)
      const { data: ftData, error: ftErr, count: ftCount } = await fq
        .order('sort_priority', { ascending: true })
        .order('views_count', { ascending: false })
        .range(offset, offset + ITEMS_PER_PAGE - 1)
      if (ftErr) throw ftErr
      if (gen !== mainListGenRef.current) return
      const ftRows = (ftData as Generation[]) ?? []
      setItems(ftRows)
      setTotalCount(ftCount ?? ftRows.length)
      setDataSource('fulltext')
    } catch (err) {
      console.error(err)
      if (gen === mainListGenRef.current) {
        setItems([])
        setTotalCount(0)
        setDataSource('trending')
      }
    } finally {
      if (gen === mainListGenRef.current) setLoading(false)
    }
  }, [qParam, pills, sidebar, currentPage])

  useEffect(() => {
    if (vibeMode) return
    void runMainFetch()
  }, [vibeMode, runMainFetch])

  const runVibeFetch = useCallback(async () => {
    if (!vibeAnchorId) return
    const vf = ++vibeFetchIdRef.current
    const offset = (currentPage - 1) * ITEMS_PER_PAGE
    setLoading(true)
    setItems([])

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          buildSearchPostBody(pills, sidebar, {
            similar_job_set_id: vibeAnchorId,
            offset,
            limit: ITEMS_PER_PAGE,
            threshold: 0.45,
          }),
        ),
      })
      const json = (await res.json()) as {
        results?: SemanticResult[]
        totalCount?: number
        error?: string
      }
      if (!res.ok) throw new Error(json.error || String(res.status))
      if (vf !== vibeFetchIdRef.current) return
      const rows = json.results ?? []
      setItems(rows)
      setTotalCount(json.totalCount ?? rows.length)
      setDataSource('semantic')
    } catch (e) {
      console.error(e)
      if (vf === vibeFetchIdRef.current) {
        setItems([])
        setTotalCount(0)
      }
    } finally {
      if (vf === vibeFetchIdRef.current) setLoading(false)
    }
  }, [vibeAnchorId, currentPage, pills, sidebar])

  useEffect(() => {
    if (!vibeMode || !vibeAnchorId) return
    void runVibeFetch()
  }, [vibeMode, vibeAnchorId, runVibeFetch])

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

  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE))

  const handlePageChange = (page: number) => {
    const next = Math.min(Math.max(1, page), totalPages)
    setCurrentPage(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    if (vibeMode) {
      setVibeMode(false)
      setVibeAnchorId(null)
      setVibeSnapshot(null)
    }
    const next = inputValue.trim()
    router.replace(next ? `/search?q=${encodeURIComponent(next)}` : '/search')
  }

  const clearAllFilters = () => {
    setCurrentPage(1)
    setPills(emptyPills)
    setSidebar(emptySidebar)
  }

  const onTagFilter = (filter: 'primary_category' | 'visual_style' | 'lighting' | 'mood', value: string) => {
    setCurrentPage(1)
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

  const handleMoreLikeThis = (item: SearchGridItem) => {
    setVibeSnapshot({
      items: [...items],
      dataSource,
      totalCount,
      currentPage,
    })
    setVibeAnchorId(item.job_set_id)
    setVibeMode(true)
    setCurrentPage(1)
  }

  const exitVibe = () => {
    if (vibeSnapshot) {
      setItems(vibeSnapshot.items)
      setDataSource(vibeSnapshot.dataSource)
      setTotalCount(vibeSnapshot.totalCount)
      setCurrentPage(vibeSnapshot.currentPage)
    }
    setVibeMode(false)
    setVibeAnchorId(null)
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

  const closeReversePanel = useCallback(() => {
    setReversePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setReverseOpen(false)
    setReverseLoading(false)
    setReverseResult(null)
    setReverseError(null)
  }, [])

  const handleReverseFile = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setReversePreview((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
      setReverseResult(null)
      setReverseError('Please upload a JPG, PNG, or WebP image.')
      setReverseLoading(false)
      setReverseOpen(true)
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setReversePreview((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
      setReverseResult(null)
      setReverseError('Image too large. Max 10MB.')
      setReverseLoading(false)
      setReverseOpen(true)
      return
    }

    setReversePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
    setReverseOpen(true)
    setReverseLoading(true)
    setReverseResult(null)
    setReverseError(null)

    try {
      const resized = await resizeImage(file, 400)
      const fd = new FormData()
      fd.append('image', new File([resized], 'image.jpg', { type: 'image/jpeg' }))
      const resp = await fetch('/api/reverse', { method: 'POST', body: fd })
      const raw = (await resp.json()) as unknown
      const data = raw as { error?: string }
      if (!resp.ok || data.error) {
        setReverseError(typeof data.error === 'string' ? data.error : 'Failed to analyze. Please try again.')
        setReverseResult(null)
        return
      }
      const normalized = normalizeReversePayload(raw)
      if (!normalized) {
        setReverseError('Invalid analysis response. Try again.')
        setReverseResult(null)
        return
      }
      setReverseResult(normalized)
    } catch {
      setReverseError('Failed to analyze image. Please try again.')
      setReverseResult(null)
    } finally {
      setReverseLoading(false)
    }
  }, [])

  const handleFindSimilarFromReverse = useCallback(
    (prompt: string) => {
      setCurrentPage(1)
      if (vibeMode) {
        setVibeMode(false)
        setVibeAnchorId(null)
        setVibeSnapshot(null)
      }
      const q = prompt.trim()
      router.replace(q ? `/search?q=${encodeURIComponent(q)}` : '/search')
    },
    [vibeMode, router],
  )

  const showTrendingHint = !qParam.trim() && !vibeMode

  return (
    <div className="flex min-h-screen flex-col bg-[#0A0A0A] text-white">
      <input
        ref={reverseFileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleReverseFile}
        aria-hidden
      />
      <TopNav />
      <SearchStickyFilterBar
        inputValue={inputValue}
        setInputValue={setInputValue}
        onSearchSubmit={handleSearchSubmit}
        inputRef={inputRef}
        pills={pills}
        setPills={setPillsResetPage}
        showClearAll={totalActiveFilterCount > 0}
        onClearAll={clearAllFilters}
        onOpenMobileFilters={() => setMobileFiltersOpen(true)}
        mobileActiveCount={totalActiveFilterCount}
        globalCounts={globalFilterCounts}
        onReverseUploadClick={() => reverseFileInputRef.current?.click()}
      />

      <div className="flex min-h-0 flex-1">
        {!desktopSidebarCollapsed && (
          <aside className="scrollbar-thin hidden w-[240px] shrink-0 flex-col border-r border-white/[0.06] bg-[rgba(255,255,255,0.02)] lg:flex">
            <SearchFilterSidebar
              variant="desktop"
              sidebar={sidebar}
              setSidebar={setSidebarResetPage}
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
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            onPageChange={handlePageChange}
            loading={loading}
            onOpenCard={openPanel}
            onTagFilter={onTagFilter}
            onMoreLikeThis={handleMoreLikeThis}
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
              setSidebar={setSidebarResetPage}
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

      <ReverseResultPanel
        open={reverseOpen}
        onClose={closeReversePanel}
        previewUrl={reversePreview}
        isLoading={reverseLoading}
        result={reverseResult}
        error={reverseError}
        onSearchWithPrompt={handleFindSimilarFromReverse}
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
