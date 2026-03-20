'use client'

import { ChevronDown, ChevronUp, X } from 'lucide-react'
import { useState } from 'react'
import type { FilterState } from '@/types/database'
import { FILTER_LABELS } from '@/types/database'

interface FilterGroup {
  key: keyof FilterState
  options: { value: string; label: string; count?: number }[]
}

interface FilterSidebarProps {
  filters: FilterState
  filterGroups: FilterGroup[]
  onFilterChange: (key: keyof FilterState, value: string) => void
  onClearAll: () => void
  totalActive: number
}

function FilterSection({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string
  options: { value: string; label: string; count?: number }[]
  selected: string[]
  onToggle: (value: string) => void
}) {
  const [open, setOpen] = useState(true)

  return (
    <div className="border-b border-zinc-800 pb-3 mb-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full text-left mb-2"
      >
        <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
          {label}
          {selected.length > 0 && (
            <span className="ml-1.5 text-[10px] bg-sky-500 text-white rounded-full px-1.5 py-0.5">
              {selected.length}
            </span>
          )}
        </span>
        {open ? (
          <ChevronUp className="w-3.5 h-3.5 text-zinc-500" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
        )}
      </button>
      {open && (
        <div className="space-y-1 max-h-52 overflow-y-auto pr-1 scrollbar-thin">
          {options.map(({ value, label: optLabel, count }) => (
            <label
              key={value}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={selected.includes(value)}
                onChange={() => onToggle(value)}
                className="w-3.5 h-3.5 rounded border-zinc-600 bg-zinc-800 text-sky-500 focus:ring-sky-500 focus:ring-offset-0 shrink-0 accent-sky-500"
              />
              <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors truncate flex-1">
                {optLabel}
              </span>
              {count != null && (
                <span className="text-[10px] text-zinc-600 shrink-0">{count.toLocaleString()}</span>
              )}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

export default function FilterSidebar({
  filters,
  filterGroups,
  onFilterChange,
  onClearAll,
  totalActive,
}: FilterSidebarProps) {
  return (
    <aside className="w-56 shrink-0 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-white">Filters</h2>
        {totalActive > 0 && (
          <button
            onClick={onClearAll}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-3 h-3" />
            Clear all
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        {filterGroups.map((group) => (
          <FilterSection
            key={group.key}
            label={FILTER_LABELS[group.key]}
            options={group.options}
            selected={filters[group.key]}
            onToggle={(value) => onFilterChange(group.key, value)}
          />
        ))}
      </div>
    </aside>
  )
}
