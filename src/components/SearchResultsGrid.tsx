'use client'

import { Loader2 } from 'lucide-react'
import SearchAssetCard from '@/components/SearchAssetCard'
import type { SearchGridItem } from '@/lib/search-filter-options'

interface Props {
  items: SearchGridItem[]
  loading?: boolean
  loadingMore?: boolean
  onOpenCard: (item: SearchGridItem) => void
  onTagFilter: (filter: 'primary_category' | 'visual_style' | 'lighting' | 'mood', value: string) => void
  onMoreLikeThis: (item: SearchGridItem) => void
  sentinelRef: React.RefObject<HTMLDivElement | null>
  vibeMode: boolean
  onExitVibe: () => void
}

const SKELETON_PLACEHOLDERS = 20

export default function SearchResultsGrid({
  items,
  loading,
  loadingMore,
  onOpenCard,
  onTagFilter,
  onMoreLikeThis,
  sentinelRef,
  vibeMode,
  onExitVibe,
}: Props) {
  const showMasonrySkeleton = !!loading && items.length === 0

  return (
    <div className="min-h-0 flex-1 px-3 pb-12 pt-2 md:px-4">
      {vibeMode && (
        <button
          type="button"
          onClick={onExitVibe}
          className="mb-4 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-xs text-white/70 transition-colors hover:border-red-500/40 hover:text-red-200"
        >
          ← Back to search results
        </button>
      )}

      {showMasonrySkeleton ? (
        <div className="search-masonry" aria-busy="true" aria-label="Loading results">
          {Array.from({ length: SKELETON_PLACEHOLDERS }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg bg-white/[0.03]"
              style={{ height: 200 + (i % 6) * 28 }}
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        !loading && <p className="py-20 text-center text-sm text-white/40">No images match your filters.</p>
      ) : (
        <div
          className={`search-masonry transition-opacity duration-300 ease-out ${loadingMore ? 'opacity-80' : 'opacity-100'}`}
        >
          {items.map((item) => (
            <SearchAssetCard
              key={item.id}
              item={item}
              onOpen={onOpenCard}
              onTagClick={onTagFilter}
              onMoreLikeThis={onMoreLikeThis}
            />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-8 w-full" />

      {loadingMore && (
        <div className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-white/25" />
        </div>
      )}
    </div>
  )
}
