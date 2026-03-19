'use client'

import Image from 'next/image'
import { Check } from 'lucide-react'
import type { WizardOption } from '@/app/api/builder/route'

interface Props {
  option: WizardOption
  label: string
  sublabel?: string
  selected: boolean
  disabled?: boolean
  onClick: () => void
  imageCount?: 1 | 2
}

export default function OptionCard({ option, label, sublabel, selected, disabled, onClick, imageCount = 2 }: Props) {
  const imgs = option.images.slice(0, imageCount)
  const isEmpty = option.count === 0

  return (
    <button
      onClick={!disabled && !isEmpty ? onClick : undefined}
      disabled={disabled || isEmpty}
      aria-pressed={selected}
      className={`relative w-full text-left rounded-xl border-2 overflow-hidden transition-all duration-200 group
        ${selected
          ? 'border-violet-500 ring-2 ring-violet-500/30 shadow-lg shadow-violet-900/20'
          : isEmpty
            ? 'border-zinc-800 opacity-40 cursor-not-allowed'
            : 'border-zinc-800 hover:border-zinc-600 hover:shadow-md cursor-pointer'
        }`}
    >
      {/* Image area */}
      <div className="relative w-full bg-zinc-900 overflow-hidden" style={{ aspectRatio: imageCount === 1 ? '4/3' : '2/1' }}>
        {imgs.length === 0 ? (
          <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center">
            <span className="text-zinc-600 text-xs">No examples</span>
          </div>
        ) : imageCount === 1 ? (
          <Image
            src={imgs[0]}
            alt={label}
            fill
            className={`object-cover transition-transform duration-300 ${!isEmpty ? 'group-hover:scale-105' : ''}`}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            unoptimized
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex">
            {imgs.map((src, i) => (
              <div key={i} className="relative flex-1 overflow-hidden" style={{ borderRight: i === 0 && imgs.length > 1 ? '1px solid #18181b' : 'none' }}>
                <Image
                  src={src}
                  alt={`${label} example ${i + 1}`}
                  fill
                  className={`object-cover transition-transform duration-300 ${!isEmpty ? 'group-hover:scale-105' : ''}`}
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 17vw"
                  unoptimized
                  loading="lazy"
                />
              </div>
            ))}
            {imgs.length === 1 && (
              <div className="flex-1 bg-zinc-800" />
            )}
          </div>
        )}

        {/* Selected overlay */}
        {selected && (
          <div className="absolute inset-0 bg-violet-600/10 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center shadow-lg">
              <Check className="w-4 h-4 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Label area */}
      <div className={`px-3 py-2.5 ${selected ? 'bg-violet-950/40' : 'bg-zinc-900'}`}>
        <p className={`text-sm font-semibold leading-tight ${selected ? 'text-violet-300' : 'text-white'}`}>
          {label}
        </p>
        {sublabel && (
          <p className="text-[11px] text-zinc-500 mt-0.5">{sublabel}</p>
        )}
        {!isEmpty && (
          <p className="text-[11px] text-zinc-600 mt-0.5">{option.count.toLocaleString()} images</p>
        )}
      </div>
    </button>
  )
}
