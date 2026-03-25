'use client'

import { useMemo } from 'react'
import SearchAssetCard from '@/components/SearchAssetCard'
import type { SearchGridItem } from '@/lib/search-filter-options'

interface Props {
  items: SearchGridItem[]
  currentPage: number
  totalPages: number
  totalCount: number
  onPageChange: (page: number) => void
  loading?: boolean
  onOpenCard: (item: SearchGridItem) => void
  onTagFilter: (filter: 'primary_category' | 'visual_style' | 'lighting' | 'mood', value: string) => void
  onMoreLikeThis: (item: SearchGridItem) => void
  vibeMode: boolean
  onExitVibe: () => void
}

const SKELETON_PLACEHOLDERS = 20

/** At most 7 page buttons with ellipses for gaps. */
function visiblePageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const set = new Set<number>()
  set.add(1)
  set.add(total)
  for (let p = current - 2; p <= current + 2; p++) {
    if (p >= 1 && p <= total) set.add(p)
  }
  const sorted = [...set].sort((a, b) => a - b)
  const out: (number | 'ellipsis')[] = []
  let prev = 0
  for (const p of sorted) {
    if (prev > 0 && p - prev > 1) out.push('ellipsis')
    out.push(p)
    prev = p
  }
  return out
}

export default function SearchResultsGrid({
  items,
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
  loading,
  onOpenCard,
  onTagFilter,
  onMoreLikeThis,
  vibeMode,
  onExitVibe,
}: Props) {
  const showSkeleton = !!loading && items.length === 0
  const pageButtons = useMemo(() => visiblePageNumbers(currentPage, totalPages), [currentPage, totalPages])

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

      {!showSkeleton && (totalCount > 0 || items.length > 0) && (
        <div className="mb-4 flex items-center justify-between px-1">
          <span className="text-xs text-white/30">{totalCount.toLocaleString()} results</span>
          <span className="text-xs text-white/30">
            Page {currentPage} of {totalPages}
          </span>
        </div>
      )}

      {showSkeleton ? (
        <div className="search-grid" aria-busy="true" aria-label="Loading results">
          {Array.from({ length: SKELETON_PLACEHOLDERS }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] max-h-[min(72vh,560px)] animate-pulse rounded-lg bg-white/[0.03]"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        !loading && <p className="py-20 text-center text-sm text-white/40">No images match your filters.</p>
      ) : (
        <div className="search-grid">
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

      {!loading && totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2 py-8">
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/50 transition-colors hover:border-white/25 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            ← Previous
          </button>

          {pageButtons.map((entry, idx) =>
            entry === 'ellipsis' ? (
              <span key={`e-${idx}`} className="px-1 text-sm text-white/35">
                …
              </span>
            ) : (
              <button
                key={entry}
                type="button"
                onClick={() => onPageChange(entry)}
                className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm transition-colors ${
                  entry === currentPage
                    ? 'border border-red-500 bg-[#dc2626] text-white'
                    : 'border border-white/10 text-white/50 hover:border-white/25 hover:text-white'
                }`}
              >
                {entry}
              </button>
            ),
          )}

          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/50 transition-colors hover:border-white/25 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
