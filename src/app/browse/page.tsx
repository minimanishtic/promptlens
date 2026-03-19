'use client'

import { useCallback, useEffect, useRef, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { FilterState, Generation, SortOption } from '@/types/database'
import ImageCard from '@/components/ImageCard'
import ImageCardSkeleton from '@/components/ImageCardSkeleton'
import FilterSidebar from '@/components/FilterSidebar'
import { SlidersHorizontal, X, FilterX } from 'lucide-react'

const PAGE_SIZE = 24

const EMPTY_FILTERS: FilterState = {
  primary_category: [],
  model: [],
  visual_style: [],
  lighting: [],
  mood: [],
  composition: [],
  reference_usage: [],
  aspect_ratio: [],
}

const STATIC_OPTIONS = {
  model: [
    { value: 'text2image_soul_v2', label: 'Soul V2' },
    { value: 'nano_banana_2', label: 'Nano 2' },
    { value: 'nano_banana_flash', label: 'Nano Flash' },
    { value: 'seedream_v4_5', label: 'Seedream 4.5' },
    { value: 'seedream_v5_lite', label: 'Seedream 5 Lite' },
    { value: 'ai_influencer', label: 'AI Influencer' },
    { value: 'flux_2', label: 'Flux 2' },
    { value: 'image_auto', label: 'Image Auto' },
    { value: 'text2keyframes', label: 'Keyframes' },
    { value: 'seedream', label: 'Seedream' },
  ],
  visual_style: [
    { value: 'Photorealistic', label: 'Photorealistic' },
    { value: 'Editorial', label: 'Editorial' },
    { value: 'Cinematic', label: 'Cinematic' },
    { value: 'Vintage/Film', label: 'Vintage / Film' },
    { value: 'Anime/Illustration', label: 'Anime / Illustration' },
    { value: 'Raw/Candid', label: 'Raw / Candid' },
  ],
  lighting: [
    { value: 'Studio', label: 'Studio' },
    { value: 'Natural/Golden Hour', label: 'Natural / Golden Hour' },
    { value: 'Flash/Harsh', label: 'Flash / Harsh' },
    { value: 'Moody/Low-key', label: 'Moody / Low-key' },
    { value: 'Neon/Colored', label: 'Neon / Colored' },
    { value: 'Backlit', label: 'Backlit' },
  ],
  mood: [
    { value: 'Warm', label: 'Warm' },
    { value: 'Cold', label: 'Cold' },
    { value: 'Dramatic', label: 'Dramatic' },
    { value: 'Intimate', label: 'Intimate' },
    { value: 'Energetic', label: 'Energetic' },
    { value: 'Nostalgic', label: 'Nostalgic' },
    { value: 'Dark/Gritty', label: 'Dark / Gritty' },
    { value: 'Clean/Minimal', label: 'Clean / Minimal' },
  ],
  composition: [
    { value: 'Close-up', label: 'Close-up' },
    { value: 'Medium Shot', label: 'Medium Shot' },
    { value: 'Full Body', label: 'Full Body' },
    { value: 'Wide/Establishing', label: 'Wide / Establishing' },
    { value: 'Overhead/Flat Lay', label: 'Overhead / Flat Lay' },
    { value: 'POV/First Person', label: 'POV / First Person' },
  ],
  reference_usage: [
    { value: 'no_reference', label: 'No Reference' },
    { value: 'single_face_ref', label: 'Single Face Ref' },
    { value: 'multi_ref', label: 'Multi Reference' },
    { value: 'style_ref', label: 'Style Reference' },
    { value: 'pose_ref', label: 'Pose Reference' },
  ],
  aspect_ratio: [
    { value: '9:16', label: '9:16 (Portrait)' },
    { value: '3:4', label: '3:4' },
    { value: '1:1', label: '1:1 (Square)' },
    { value: '4:5', label: '4:5' },
    { value: '16:9', label: '16:9 (Landscape)' },
  ],
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'views_count', label: 'Most Viewed' },
  { value: 'likes_count', label: 'Most Liked' },
]

const GRID_SIZES = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw'

function BrowseContent() {
  const searchParams = useSearchParams()

  const initialFilters = (): FilterState => {
    const cat = searchParams.get('category')
    return cat ? { ...EMPTY_FILTERS, primary_category: [cat] } : EMPTY_FILTERS
  }

  const [images, setImages] = useState<Generation[]>([])
  const [filters, setFilters] = useState<FilterState>(initialFilters)
  const [sort, setSort] = useState<SortOption>('views_count')
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [categories, setCategories] = useState<{ value: string; label: string; count: number }[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pageRef = useRef(0)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const mainRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase
      .from('generations')
      .select('primary_category')
      .not('primary_category', 'is', null)
      .then(({ data }) => {
        if (!data) return
        const counts: Record<string, number> = {}
        ;(data as { primary_category: string | null }[]).forEach((row) => {
          const cat = row.primary_category
          if (cat) counts[cat] = (counts[cat] ?? 0) + 1
        })
        setCategories(
          Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .map(([value, count]) => ({ value, label: value, count })),
        )
      })
  }, [])

  const fetchImages = useCallback(
    async (page: number, currentFilters: FilterState, currentSort: SortOption, replace: boolean) => {
      if (page === 0) setLoading(true)
      else setLoadingMore(true)

      let query = supabase
        .from('generations')
        .select('*')
        .order(currentSort, { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)

      if (currentFilters.primary_category.length > 0)
        query = query.in('primary_category', currentFilters.primary_category)
      if (currentFilters.model.length > 0)
        query = query.in('model', currentFilters.model)
      if (currentFilters.visual_style.length > 0)
        query = query.in('visual_style', currentFilters.visual_style)
      if (currentFilters.lighting.length > 0)
        query = query.in('lighting', currentFilters.lighting)
      if (currentFilters.mood.length > 0)
        query = query.in('mood', currentFilters.mood)
      if (currentFilters.composition.length > 0)
        query = query.in('composition', currentFilters.composition)
      if (currentFilters.reference_usage.length > 0)
        query = query.in('reference_usage', currentFilters.reference_usage)
      if (currentFilters.aspect_ratio.length > 0)
        query = query.in('aspect_ratio', currentFilters.aspect_ratio)

      const { data, error } = await query

      if (!error && data) {
        setImages((prev) => (replace ? data : [...prev, ...data]))
        setHasMore(data.length === PAGE_SIZE)
      }

      setLoading(false)
      setLoadingMore(false)
    },
    [],
  )

  // Reset + fetch + scroll to top on filter/sort change
  useEffect(() => {
    pageRef.current = 0
    setHasMore(true)
    fetchImages(0, filters, sort, true)
    // Smooth scroll to top of main content
    mainRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [filters, sort, fetchImages])

  // Infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          pageRef.current += 1
          fetchImages(pageRef.current, filters, sort, false)
        }
      },
      { rootMargin: '400px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, loading, filters, sort, fetchImages])

  // Close sidebar on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [sidebarOpen])

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => {
      const current = prev[key]
      return {
        ...prev,
        [key]: current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value],
      }
    })
  }

  const handleClearAll = () => setFilters(EMPTY_FILTERS)

  const totalActive = Object.values(filters).reduce((sum, arr) => sum + arr.length, 0)

  const filterGroups = [
    { key: 'primary_category' as const, options: categories },
    { key: 'model' as const, options: STATIC_OPTIONS.model },
    { key: 'visual_style' as const, options: STATIC_OPTIONS.visual_style },
    { key: 'lighting' as const, options: STATIC_OPTIONS.lighting },
    { key: 'mood' as const, options: STATIC_OPTIONS.mood },
    { key: 'composition' as const, options: STATIC_OPTIONS.composition },
    { key: 'reference_usage' as const, options: STATIC_OPTIONS.reference_usage },
    { key: 'aspect_ratio' as const, options: STATIC_OPTIONS.aspect_ratio },
  ]

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
        <div className="max-w-screen-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <a href="/" className="text-lg font-bold text-white shrink-0">
            Prompt<span className="text-violet-500">Lens</span>
          </a>
          <span className="text-zinc-700 hidden sm:block">|</span>
          <nav className="hidden sm:flex items-center gap-4 text-sm text-zinc-400">
            <span className="text-white font-medium">Browse</span>
            <a href="/glossary" className="hover:text-white transition-colors">Glossary</a>
            <a href="/analytics" className="hover:text-white transition-colors">Analytics</a>
            <a href="/templates" className="hover:text-white transition-colors">Templates</a>
            <a href="/builder" className="hover:text-white transition-colors">Builder</a>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {/* Mobile filter toggle */}
            <button
              className="flex items-center gap-2 text-sm text-zinc-300 lg:hidden bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
              {totalActive > 0 && (
                <span className="bg-violet-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {totalActive}
                </span>
              )}
            </button>

            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="text-sm bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-600"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="max-w-screen-2xl mx-auto px-4 py-6 flex gap-6">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`
            fixed top-0 left-0 bottom-0 z-50 w-72 bg-zinc-950 border-r border-zinc-800 p-5 overflow-y-auto
            transition-transform duration-300 ease-in-out
            lg:static lg:z-auto lg:w-56 lg:border-0 lg:p-0 lg:translate-x-0 lg:overflow-visible lg:shrink-0
            ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
          `}
        >
          {/* Mobile sidebar header */}
          <div className="flex items-center justify-between mb-5 lg:hidden">
            <span className="text-sm font-semibold text-white">Filters</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
            >
              <X className="w-4 h-4 text-zinc-400" />
            </button>
          </div>
          <FilterSidebar
            filters={filters}
            filterGroups={filterGroups}
            onFilterChange={handleFilterChange}
            onClearAll={handleClearAll}
            totalActive={totalActive}
          />
        </div>

        {/* Main content */}
        <main ref={mainRef} className="flex-1 min-w-0">
          {/* Active filter chips */}
          {totalActive > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(filters).flatMap(([key, values]) =>
                (values as string[]).map((val) => (
                  <button
                    key={`${key}:${val}`}
                    onClick={() => handleFilterChange(key as keyof FilterState, val)}
                    className="flex items-center gap-1.5 text-xs bg-violet-600/20 text-violet-300 border border-violet-600/40 rounded-full px-3 py-1 hover:bg-violet-600/30 transition-colors"
                  >
                    {val}
                    <X className="w-3 h-3" />
                  </button>
                )),
              )}
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
              {Array.from({ length: 24 }).map((_, i) => (
                <ImageCardSkeleton key={i} />
              ))}
            </div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <FilterX className="w-12 h-12 text-zinc-700 mb-4" />
              <p className="text-zinc-300 text-lg font-medium mb-2">No images match these filters</p>
              <p className="text-zinc-500 text-sm mb-6">Try removing some filters to see more results.</p>
              {totalActive > 0 && (
                <button
                  onClick={handleClearAll}
                  className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
              {images.map((image, i) => (
                <ImageCard
                  key={image.id}
                  image={image}
                  priority={i < 6}
                  sizes={GRID_SIZES}
                />
              ))}
              {loadingMore &&
                Array.from({ length: 6 }).map((_, i) => <ImageCardSkeleton key={`more-${i}`} />)}
            </div>
          )}

          <div ref={sentinelRef} className="h-1" />

          {!hasMore && images.length > 0 && (
            <p className="text-center text-zinc-600 text-sm py-8">
              {images.length.toLocaleString()} images loaded &middot; no more results
            </p>
          )}
        </main>
      </div>
    </div>
  )
}

export default function BrowsePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <BrowseContent />
    </Suspense>
  )
}
