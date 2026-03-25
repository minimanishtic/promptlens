'use client'

import { useState } from 'react'
import { Filter, Mountain, PanelLeftClose, Search, ChevronDown, Upload } from 'lucide-react'
import {
  SEARCH_MODEL_OPTIONS,
  getSearchModelLabel,
  SEARCH_CATEGORY_OPTIONS,
  SEARCH_ASPECT_OPTIONS,
  SEARCH_STYLE_PILL_OPTIONS,
  SIDEBAR_VISUAL_STYLE,
  SIDEBAR_LIGHTING,
  SIDEBAR_MOOD,
  SIDEBAR_COMPOSITION,
  SIDEBAR_CAMERA,
  type SearchPillState,
  type SearchSidebarState,
} from '@/lib/search-filter-options'
import type { SearchGlobalFilterCounts } from '@/lib/search-global-filter-counts'

export type { SearchPillState, SearchSidebarState }

const pillBtn =
  'rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-1.5 text-xs text-white/50 outline-none transition-colors hover:border-white/20'

const pillBtnActive = 'border-[rgba(220,38,38,0.5)] text-[rgba(255,140,140,0.8)]'

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-white/[0.06] py-2 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between py-2 text-left text-xs font-medium text-white/70"
      >
        {title}
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? '' : '-rotate-90'}`} />
      </button>
      {open && <div className="space-y-1.5 pb-2">{children}</div>}
    </div>
  )
}

function CheckboxRow({
  label,
  count,
  checked,
  onChange,
}: {
  label: string
  count: number
  checked: boolean
  onChange: () => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-white/50 hover:text-white/80">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="rounded border-white/20 bg-white/[0.04] text-red-600 focus:ring-red-500/40"
      />
      <span>
        {label} <span className="text-white/30">({count})</span>
      </span>
    </label>
  )
}

export function SearchFilterSidebar({
  sidebar,
  setSidebar,
  globalCounts,
  variant,
  onCloseMobile,
  onToggleDesktopCollapse,
  activeFilterCount,
}: {
  sidebar: SearchSidebarState
  setSidebar: React.Dispatch<React.SetStateAction<SearchSidebarState>>
  globalCounts: SearchGlobalFilterCounts | null
  variant: 'mobile' | 'desktop'
  onCloseMobile?: () => void
  onToggleDesktopCollapse?: () => void
  activeFilterCount: number
}) {
  const toggleSidebar = (key: keyof SearchSidebarState, value: string) => {
    setSidebar((prev) => {
      const arr = prev[key]
      const next = arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value]
      return { ...prev, [key]: next }
    })
  }

  const inner = (
    <>
      {variant === 'mobile' && (
        <div className="mb-2 flex items-center justify-between border-b border-white/[0.06] px-1 pb-3">
          <span className="text-sm font-medium text-white">Filters</span>
          <button type="button" onClick={onCloseMobile} className="text-xs text-white/50 hover:text-white/80">
            Close
          </button>
        </div>
      )}
      {variant === 'desktop' && onToggleDesktopCollapse && (
        <button
          type="button"
          onClick={onToggleDesktopCollapse}
          className="mb-2 flex w-full items-center gap-2 rounded-lg px-1 py-2 text-left text-xs text-white/45 transition-colors hover:bg-white/[0.04] hover:text-white/80"
        >
          <Filter className="h-4 w-4 shrink-0" />
          <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-red-600/25 px-2 py-0.5 text-[10px] text-red-200">{activeFilterCount}</span>
            )}
          </span>
          <PanelLeftClose className="h-4 w-4 shrink-0 text-white/40" aria-hidden />
        </button>
      )}

      <div className="scrollbar-thin flex-1 overflow-y-auto pr-1">
        <Section title="Visual style">
          {SIDEBAR_VISUAL_STYLE.map((o) => (
            <CheckboxRow
              key={o.value}
              label={o.label}
              count={globalCounts?.visual_style[o.value] ?? 0}
              checked={sidebar.visual_style.includes(o.value)}
              onChange={() => toggleSidebar('visual_style', o.value)}
            />
          ))}
        </Section>
        <Section title="Lighting">
          {SIDEBAR_LIGHTING.map((o) => (
            <CheckboxRow
              key={o.value}
              label={o.label}
              count={globalCounts?.lighting[o.value] ?? 0}
              checked={sidebar.lighting.includes(o.value)}
              onChange={() => toggleSidebar('lighting', o.value)}
            />
          ))}
        </Section>
        <Section title="Mood">
          {SIDEBAR_MOOD.map((o) => (
            <CheckboxRow
              key={o.value}
              label={o.label}
              count={globalCounts?.mood[o.value] ?? 0}
              checked={sidebar.mood.includes(o.value)}
              onChange={() => toggleSidebar('mood', o.value)}
            />
          ))}
        </Section>
        <Section title="Composition">
          {SIDEBAR_COMPOSITION.map((o) => (
            <CheckboxRow
              key={o.value}
              label={o.label}
              count={globalCounts?.composition[o.value] ?? 0}
              checked={sidebar.composition.includes(o.value)}
              onChange={() => toggleSidebar('composition', o.value)}
            />
          ))}
        </Section>
        <Section title="Camera">
          {SIDEBAR_CAMERA.map((o) => (
            <CheckboxRow
              key={o.value}
              label={o.label}
              count={globalCounts?.camera_simulation[o.value] ?? 0}
              checked={sidebar.camera_simulation.includes(o.value)}
              onChange={() => toggleSidebar('camera_simulation', o.value)}
            />
          ))}
        </Section>
      </div>
    </>
  )

  if (variant === 'mobile') {
    return <div className="flex h-full flex-col px-3 py-3">{inner}</div>
  }

  return (
    <div className="flex h-full min-h-0 flex-col px-3 py-3">
      {inner}
    </div>
  )
}

export function SearchStickyFilterBar({
  inputValue,
  setInputValue,
  onSearchSubmit,
  inputRef,
  pills,
  setPills,
  showClearAll,
  onClearAll,
  onOpenMobileFilters,
  mobileActiveCount,
}: {
  inputValue: string
  setInputValue: (v: string) => void
  onSearchSubmit: (e: React.FormEvent) => void
  inputRef: React.RefObject<HTMLInputElement | null>
  pills: SearchPillState
  setPills: React.Dispatch<React.SetStateAction<SearchPillState>>
  showClearAll: boolean
  onClearAll: () => void
  onOpenMobileFilters: () => void
  mobileActiveCount: number
}) {
  return (
    <div className="sticky top-14 z-30 border-b border-white/[0.06] bg-[#0A0A0A]">
      <div className="mx-auto max-w-[100vw] px-3 py-3 md:px-4">
        <form onSubmit={onSearchSubmit} className="flex flex-col gap-3">
          <div className="relative flex items-center gap-2 rounded-[10px] border border-white/10 bg-white/[0.04] px-4 py-3">
            <Search className="h-4 w-4 shrink-0 text-white/35" aria-hidden />
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Search prompts…"
              className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
            />
            <span className="inline-flex shrink-0 text-white/25" title="Upload (coming soon)">
              <Upload className="h-4 w-4" aria-hidden />
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenMobileFilters}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs text-white/60 lg:hidden"
            >
              <Filter className="h-3.5 w-3.5" />
              Filters{mobileActiveCount > 0 ? ` (${mobileActiveCount})` : ''}
            </button>

            <select
              value={pills.model ?? ''}
              onChange={(e) => setPills((p) => ({ ...p, model: e.target.value || null }))}
              className={`${pillBtn} max-w-[140px] cursor-pointer truncate sm:max-w-none ${pills.model ? pillBtnActive : ''}`}
              aria-label="Model"
            >
              <option value="">Model</option>
              {SEARCH_MODEL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {getSearchModelLabel(o.value)}
                </option>
              ))}
            </select>

            <select
              value={pills.category ?? ''}
              onChange={(e) => setPills((p) => ({ ...p, category: e.target.value || null }))}
              className={`${pillBtn} cursor-pointer ${pills.category ? pillBtnActive : ''}`}
              aria-label="Category"
            >
              <option value="">Category</option>
              {SEARCH_CATEGORY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <select
              value={pills.aspect_ratio ?? ''}
              onChange={(e) => setPills((p) => ({ ...p, aspect_ratio: e.target.value || null }))}
              className={`${pillBtn} cursor-pointer ${pills.aspect_ratio ? pillBtnActive : ''}`}
              aria-label="Aspect ratio"
            >
              <option value="">Aspect ratio</option>
              {SEARCH_ASPECT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <select
              value={pills.visual_style ?? ''}
              onChange={(e) => setPills((p) => ({ ...p, visual_style: e.target.value || null }))}
              className={`${pillBtn} cursor-pointer ${pills.visual_style ? pillBtnActive : ''}`}
              aria-label="Style"
            >
              <option value="">Style</option>
              {SEARCH_STYLE_PILL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            {showClearAll && (
              <button type="button" onClick={onClearAll} className="text-xs text-red-300/80 hover:text-red-200">
                Clear all
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export { emptyPills, emptySidebar } from '@/lib/search-filter-options'
