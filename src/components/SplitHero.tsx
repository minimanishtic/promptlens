'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Search, Mountain } from 'lucide-react'

export interface SplitHeroProps {
  bgUrls: string[]
  promptsIndexed: number
}

function OrBadge({ className }: { className?: string }) {
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/[0.1] bg-[#0a0a0a] text-[11px] font-medium text-white/40 ${className ?? ''}`}
    >
      or
    </span>
  )
}

export default function SplitHero({ bgUrls, promptsIndexed }: SplitHeroProps) {
  const cells = bgUrls.slice(0, 32)

  return (
    <section className="relative flex min-h-0 flex-1 flex-col md:flex-row md:min-h-[calc(90vh-3.5rem)]">
      {/* Background image grid — full bleed (4×4 mobile, 8×4 desktop) */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        <div className="animate-hero-drift grid h-full min-h-full w-full grid-cols-4 grid-rows-4 gap-1 p-1 opacity-[0.04] md:grid-cols-8 md:grid-rows-4">
          {cells.map((url, i) => (
            <div
              key={`${url}-${i}`}
              className={`relative min-h-0 overflow-hidden ${i >= 16 ? 'hidden md:block' : ''}`}
            >
              <Image
                src={url}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 767px) 25vw, 12vw"
                loading="lazy"
                unoptimized
              />
            </div>
          ))}
        </div>
      </div>

      {/* Left pane — search journey */}
      <Link
        href="/search"
        className="group relative z-10 flex min-h-[50vh] flex-1 flex-col justify-end border-b border-white/[0.06] p-6 transition-[flex] duration-500 ease-in-out hover:flex-[1.12] md:min-h-0 md:border-b-0 md:hover:flex-[1.12] active:scale-[0.995]"
      >
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              'linear-gradient(160deg, rgba(30,8,8,0.85) 0%, rgba(15,4,4,0.92) 50%, rgba(10,5,5,0.97) 85%)',
          }}
        />
        <div className="relative z-10 mx-auto flex w-full max-w-lg flex-col gap-4 pb-10 md:pb-12">
          {/* Search bar preview */}
          <div className="flex items-center gap-3 rounded-[10px] border border-[rgba(220,38,38,0.18)] bg-[rgba(220,38,38,0.06)] px-3.5 py-3">
            <Search
              className="h-4 w-4 shrink-0 text-[rgba(255,100,100,0.4)]"
              strokeWidth={2}
              aria-hidden
            />
            <span className="flex min-w-0 flex-1 items-center text-[13px] text-[rgba(255,140,140,0.3)]">
              <span className="truncate">golden hour portrait with bokeh</span>
              <span
                className="ml-0.5 inline-block h-4 w-px shrink-0 bg-[rgba(220,38,38,0.5)] animate-hero-cursor-blink"
                aria-hidden
              />
            </span>
            <span className="h-[18px] w-px shrink-0 bg-[rgba(255,100,100,0.15)]" aria-hidden />
            <Mountain
              className="h-4 w-4 shrink-0 text-[rgba(255,120,120,0.35)] transition-colors group-hover:text-[rgba(255,120,120,0.7)]"
              strokeWidth={2}
              aria-hidden
            />
          </div>
          <p className="text-[10px] text-[rgba(255,140,140,0.22)]">
            or drop a reference image to reverse-engineer its prompt
          </p>
          <div className="flex flex-wrap gap-1.5">
            {['cinematic rain scene', 'product flat-lay', 'neon street portrait'].map((t) => (
              <span
                key={t}
                className="rounded-[14px] border border-[rgba(220,38,38,0.2)] px-2.5 py-1 text-[10px] text-[rgba(255,140,140,0.5)] transition-colors hover:border-[rgba(220,38,38,0.45)]"
              >
                {t}
              </span>
            ))}
          </div>
          <span className="w-fit rounded-[20px] border border-[rgba(220,38,38,0.4)] px-3 py-0.5 text-[11px] text-[rgba(255,140,140,0.8)]">
            Search + reverse-engineer
          </span>
          <h2 className="text-xl font-medium text-white md:text-[22px]">I know what I want</h2>
          <p className="text-xs leading-relaxed text-[rgba(255,180,180,0.55)] md:text-[13px] md:leading-[1.6]">
            Describe any visual in plain English or drop a reference image. Get the exact prompt, model,
            and settings to recreate it.
          </p>
          <span className="mt-1 inline-flex w-fit items-center rounded-lg bg-[#dc2626] px-6 py-2.5 text-[13px] font-medium text-white transition-opacity group-hover:opacity-90 group-active:scale-[0.97]">
            Find my prompt →
          </span>
        </div>
        <span className="absolute bottom-4 right-4 z-10 text-xs text-[rgba(255,120,120,0.3)] md:bottom-6 md:right-6">
          {promptsIndexed.toLocaleString()} prompts indexed
        </span>
      </Link>

      {/* Mobile divider + or */}
      <div className="relative z-20 flex h-12 shrink-0 items-center justify-center bg-[#060606] md:hidden">
        <div className="absolute inset-x-4 top-1/2 h-px -translate-y-1/2 bg-white/[0.06]" />
        <OrBadge className="relative z-10" />
      </div>

      {/* Desktop vertical divider + or */}
      <div className="relative z-20 hidden w-px shrink-0 self-stretch bg-white/[0.06] md:block md:min-h-[calc(90vh-3.5rem)]">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <OrBadge />
        </div>
      </div>

      {/* Right pane — builder */}
      <Link
        href="/builder"
        className="group relative z-10 flex min-h-[50vh] flex-1 flex-col justify-end p-6 transition-[flex] duration-500 ease-in-out hover:flex-[1.12] md:min-h-0 md:hover:flex-[1.12] active:scale-[0.995]"
      >
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              'linear-gradient(160deg, rgba(10,10,10,0.85) 0%, rgba(8,8,8,0.92) 50%, rgba(6,6,6,0.97) 85%)',
          }}
        />
        <div className="relative z-10 mx-auto flex w-full max-w-lg flex-col gap-4 pb-10 md:pb-12">
          <div className="flex flex-col gap-2">
            {[
              'Pick a category',
              'Choose a visual style',
              'Set the lighting',
              'Define the mood',
              'Select your model',
            ].map((label, idx) => {
              const active = idx === 0
              return (
                <div key={label} className="flex items-center gap-2.5 text-xs">
                  <span
                    className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-[10px] ${
                      active
                        ? 'border border-white/50 bg-white/[0.08] text-white'
                        : 'border border-white/[0.12] text-white/35'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className={active ? 'text-white' : 'text-white/35'}>{label}</span>
                </div>
              )
            })}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: 'Flux Pro', color: '#a78bfa' },
              { label: 'SDXL', color: '#34d399' },
              { label: 'Nano 2', color: '#f59e0b' },
              { label: 'Soul V2', color: '#f472b6' },
            ].map(({ label, color }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-[14px] border border-white/[0.08] py-0.5 pl-2 pr-2.5 text-[10px] text-white/30 transition-colors hover:border-white/25"
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
                {label}
              </span>
            ))}
          </div>
          <span className="w-fit rounded-[20px] border border-white/20 px-3 py-0.5 text-[11px] text-white/[0.55]">
            Step-by-step builder
          </span>
          <h2 className="text-xl font-medium text-white md:text-[22px]">Help me figure it out</h2>
          <p className="text-xs leading-relaxed text-white/40 md:text-[13px] md:leading-[1.6]">
            Don&apos;t know what you need? We&apos;ll narrow it down together. Pick options, see real
            results at every step.
          </p>
          <span className="mt-1 inline-flex w-fit items-center rounded-lg bg-white px-6 py-2.5 text-[13px] font-medium text-[#0a0a0a] transition-opacity group-hover:opacity-90 group-active:scale-[0.97]">
            Start building →
          </span>
        </div>
        <span className="absolute bottom-4 right-4 z-10 text-xs text-white/[0.18] md:bottom-6 md:right-6">
          5 steps to your prompt
        </span>
      </Link>
    </section>
  )
}
