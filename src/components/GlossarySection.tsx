'use client'

import { useState, useId } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import GlossaryImageRow from '@/components/GlossaryImageRow'

export interface GlossaryOption {
  value: string
  description: string
}

export interface GlossarySectionData {
  category: string
  column: string
  options: GlossaryOption[]
}

interface GlossarySectionProps {
  section: GlossarySectionData
  filterQuery: string
  defaultOpen?: boolean
}

export default function GlossarySection({ section, filterQuery, defaultOpen = true }: GlossarySectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  const headingId = useId()

  const filtered = filterQuery.trim()
    ? section.options.filter(
        (o) =>
          o.value.toLowerCase().includes(filterQuery.toLowerCase()) ||
          o.description.toLowerCase().includes(filterQuery.toLowerCase()),
      )
    : section.options

  // If filtering and no matches, hide the whole section
  if (filterQuery.trim() && filtered.length === 0) return null

  return (
    <section id={section.category.toLowerCase().replace(/\s+/g, '-')} className="border border-zinc-800 rounded-2xl overflow-hidden">
      {/* Section header */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={headingId}
        className="w-full flex items-center justify-between px-6 py-5 bg-zinc-900/60 hover:bg-zinc-900 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-violet-400 uppercase tracking-widest">
            {section.category}
          </span>
          <span className="text-xs text-zinc-600">{section.options.length} settings</span>
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-zinc-500 shrink-0" />
          : <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />
        }
      </button>

      {/* Options */}
      {open && (
        <div id={headingId} className="divide-y divide-zinc-800/60">
          {filtered.map((option) => (
            <div
              key={option.value}
              id={option.value.toLowerCase().replace(/[\s/]+/g, '-')}
              className="px-6 py-5"
            >
              <div className="flex items-start justify-between gap-4 mb-1">
                <h3 className="text-sm font-semibold text-white">{option.value}</h3>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed mb-3">{option.description}</p>
              <GlossaryImageRow column={section.column} value={option.value} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
