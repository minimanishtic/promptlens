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
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`relative w-full text-left rounded-xl border-2 overflow-hidden transition-all duration-200 group
        ${selected
          ? 'border-sky-400 ring-2 ring-sky-500/20 shadow-lg shadow-sky-900/20'
          : 'border-zinc-800 hover:border-zinc-600 hover:shadow-md cursor-pointer'
        }`}
    >
      {/* Image area */}
      <div className="relative w-full bg-zinc-900 overflow-hidden" style={{ aspectRatio: imageCount === 1 ? '4/3' : '2/1' }}>
        {imgs.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-800">
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 py-8">
              <svg
                className="h-8 w-8 text-white/10"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
                />
              </svg>
              <span className="text-[11px] text-white/20">More prompts coming soon</span>
            </div>
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
          <div className="absolute inset-0 bg-sky-500/10 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center shadow-lg">
              <Check className="w-4 h-4 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Label area */}
      <div className={`px-3 py-2.5 ${selected ? 'bg-sky-950/40' : 'bg-zinc-900'}`}>
        <p className={`text-sm font-semibold leading-tight ${selected ? 'text-sky-300' : 'text-white'}`}>
          {label}
        </p>
        {sublabel && (
          <p className="text-[11px] text-zinc-500 mt-0.5">{sublabel}</p>
        )}
        {option.count > 0 && (
          <p className="mt-0.5 text-[11px] text-zinc-600">{option.count.toLocaleString()} images</p>
        )}
      </div>
    </button>
  )
}
