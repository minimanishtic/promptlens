'use client'

import { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp, FileText } from 'lucide-react'
import TemplateCard from './TemplateCard'
import type { CategoryTemplates } from '@/lib/templates'
import type { Generation } from '@/types/database'
import { MODEL_DISPLAY_NAMES } from '@/types/database'

interface Props {
  allData: CategoryTemplates[]       // full unfiltered data (all models)
  allModels: string[]
}

function CategorySection({ category, templates }: { category: string; templates: Generation[] }) {
  const [open, setOpen] = useState(true)

  if (templates.length === 0) return null

  return (
    <section id={category.replace(/\s+/g, '-').toLowerCase()}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-3 group"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-white group-hover:text-violet-300 transition-colors text-left">
            {category}
          </h2>
          <span className="text-xs text-zinc-600 tabular-nums">{templates.length} templates</span>
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-zinc-500 shrink-0" />
          : <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />}
      </button>

      {open && (
        <div className="flex flex-col gap-3 pb-4">
          {templates.map((t, i) => (
            <TemplateCard key={t.id} template={t} rank={i + 1} />
          ))}
        </div>
      )}

      <div className="border-b border-zinc-800/60 mb-6" />
    </section>
  )
}

export default function TemplatesClient({ allData, allModels }: Props) {
  const [selectedModel, setSelectedModel] = useState<string>('')

  // Client-side filter — top 5 per category for selected model
  const filtered = useMemo<CategoryTemplates[]>(() => {
    if (!selectedModel) return allData

    return allData.map((cat) => ({
      category: cat.category,
      templates: cat.templates
        .filter((t) => t.model === selectedModel)
        .slice(0, 5),
    }))
  }, [allData, selectedModel])

  const visibleCount = filtered.reduce((s, c) => s + c.templates.length, 0)

  return (
    <div>
      {/* Model filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        <span className="text-xs text-zinc-500 mr-1 shrink-0">Filter by model:</span>
        <button
          onClick={() => setSelectedModel('')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
            !selectedModel
              ? 'bg-violet-600 text-white border-violet-600'
              : 'bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-white'
          }`}
        >
          All models
        </button>
        {allModels.map((model) => (
          <button
            key={model}
            onClick={() => setSelectedModel(model === selectedModel ? '' : model)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
              selectedModel === model
                ? 'bg-violet-600 text-white border-violet-600'
                : 'bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-white'
            }`}
          >
            {MODEL_DISPLAY_NAMES[model] ?? model}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {visibleCount === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <FileText className="w-7 h-7 text-zinc-600" />
          </div>
          <p className="text-zinc-400 font-medium">No templates for this model yet</p>
          <p className="text-zinc-600 text-sm">Try selecting a different model filter above.</p>
          <button
            onClick={() => setSelectedModel('')}
            className="mt-2 text-xs text-violet-400 hover:text-violet-300 underline underline-offset-2 transition-colors"
          >
            Clear filter
          </button>
        </div>
      )}

      {/* Category sections */}
      {filtered.map((cat) => (
        <CategorySection key={cat.category} category={cat.category} templates={cat.templates} />
      ))}
    </div>
  )
}
