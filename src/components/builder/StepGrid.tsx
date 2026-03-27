'use client'

import { Loader2 } from 'lucide-react'
import OptionCard from './OptionCard'
import type { WizardOption } from '@/app/api/builder/route'

interface Props {
  options: WizardOption[]
  selected: string
  onSelect: (value: string) => void
  loading: boolean
  cols?: 2 | 3
  imageCount?: 1 | 2
  isModelStep?: boolean
}

export default function StepGrid({
  options,
  selected,
  onSelect,
  loading,
  cols = 3,
  imageCount = 2,
  isModelStep,
}: Props) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-zinc-500">
        <Loader2 className="w-7 h-7 animate-spin text-sky-400" />
        <span className="text-sm">Loading examples…</span>
      </div>
    )
  }

  const gridClass =
    cols === 2 ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'

  return (
    <div className={gridClass}>
      {options.map((opt) => {
        const sub = isModelStep
          ? opt.count > 0
            ? `${opt.count.toLocaleString()} images · avg ${(opt.avg_views ?? 0).toLocaleString()} views`
            : undefined
          : opt.description

        return (
          <div key={opt.value} className="relative">
            {opt.recommended && (
              <div className="absolute -top-2 left-3 z-10 px-2 py-0.5 rounded-full bg-sky-500 text-white text-[10px] font-bold uppercase tracking-wide shadow">
                RECOMMENDED
              </div>
            )}
            <OptionCard
              option={opt}
              label={opt.label}
              sublabel={sub}
              selected={selected === opt.value}
              onClick={() => onSelect(opt.value)}
              imageCount={imageCount}
            />
          </div>
        )
      })}
    </div>
  )
}
