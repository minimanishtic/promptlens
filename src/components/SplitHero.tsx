'use client'

import Link from 'next/link'
import { Search, Mountain } from 'lucide-react'

export interface SplitHeroProps {
  bgUrls: string[]
  promptsIndexed: number
}

function padGridUrls(urls: string[], count: number): string[] {
  if (urls.length === 0) return []
  return Array.from({ length: count }, (_, i) => urls[i % urls.length])
}

function OrBadge({ className, mobile }: { className?: string; mobile?: boolean }) {
  return (
    <span
      className={`relative z-[40] flex shrink-0 items-center justify-center rounded-full border border-white/[0.15] bg-[rgba(20,20,20,0.7)] text-[13px] font-medium text-white/40 shadow-[0_0_20px_rgba(0,0,0,0.5)] backdrop-blur-[12px] ${
        mobile ? 'h-11 w-11' : 'h-12 w-12'
      } ${className ?? ''}`}
    >
      or
    </span>
  )
}

export default function SplitHero({ bgUrls, promptsIndexed }: SplitHeroProps) {
  const cells = padGridUrls(bgUrls.slice(0, 32), 18)

  return (
    <section className="relative flex min-h-0 flex-1 flex-col md:flex-row md:min-h-[calc(90vh-3.5rem)]">
      {/* z-0 stack: drifting image grid + radial vignette (below all panes) */}
      <div
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        aria-hidden
      >
        <div className="animate-hero-drift relative z-0 grid h-full min-h-full w-full grid-cols-4 grid-rows-3 gap-1 p-1 opacity-[0.356] md:grid-cols-6 md:grid-rows-3">
          {cells.map((url, i) => (
            <div
              key={`${url}-${i}`}
              className={`relative min-h-0 overflow-hidden ${i >= 12 ? 'hidden md:block' : ''}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </div>
          ))}
        </div>
        <div
          className="absolute inset-0 z-[1]"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(0,0,0,0.9) 25%, rgba(0,0,0,0.5) 65%, rgba(0,0,0,0.2) 100%)',
          }}
        />
      </div>

      {/* Left pane — search journey */}
      <Link
        href="/search"
        className="group relative z-[20] flex min-h-[45vh] flex-1 flex-col justify-center border-b border-white/[0.06] px-6 py-10 transition-[flex] duration-500 ease-in-out hover:flex-[1.12] md:min-h-0 md:border-b-0 md:py-16 md:hover:flex-[1.12] active:scale-[0.995]"
      >
        <div
          className="pointer-events-none absolute inset-0 z-[2]"
          style={{
            background:
              'linear-gradient(160deg, rgba(30,8,8,0.7) 0%, rgba(15,4,4,0.85) 50%, rgba(10,5,5,0.93) 85%)',
          }}
        />
        <div className="relative z-[30] ml-auto flex w-full max-w-[440px] flex-col pl-6 pr-8 md:pl-8 md:pr-12">
          <div className="rounded-xl border border-[rgba(220,38,38,0.25)] bg-[rgba(220,38,38,0.08)] px-[18px] py-4 transition-colors group-hover:border-[rgba(220,38,38,0.4)]">
            <div className="flex items-center gap-3">
              <Search
                className="h-5 w-5 shrink-0 text-[rgba(255,100,100,0.4)]"
                strokeWidth={2}
                aria-hidden
              />
              <span className="flex min-w-0 flex-1 items-center text-[15px] text-[rgba(255,140,140,0.3)]">
                <span className="truncate">golden hour portrait with bokeh</span>
                <span
                  className="ml-0.5 inline-block h-4 w-px shrink-0 bg-[rgba(220,38,38,0.5)] animate-hero-cursor-blink"
                  aria-hidden
                />
              </span>
              <span className="h-[18px] w-px shrink-0 bg-[rgba(255,100,100,0.15)]" aria-hidden />
              <Mountain
                className="h-5 w-5 shrink-0 text-[rgba(255,120,120,0.35)] transition-colors group-hover:text-[rgba(255,120,120,0.7)]"
                strokeWidth={2}
                aria-hidden
              />
            </div>
          </div>
          <p className="mt-2 text-[10px] text-[rgba(255,140,140,0.22)]">
            or drop a reference image to reverse-engineer its prompt
          </p>
          <div className="mt-5 flex flex-wrap gap-1.5">
            {['cinematic rain scene', 'product flat-lay', 'neon street portrait'].map((t) => (
              <span
                key={t}
                className="rounded-2xl border border-[rgba(220,38,38,0.2)] px-3.5 py-1.5 text-[11px] text-[rgba(255,140,140,0.5)] transition-colors hover:border-[rgba(220,38,38,0.45)]"
              >
                {t}
              </span>
            ))}
          </div>
          <span className="mt-7 w-fit rounded-[20px] border border-[rgba(220,38,38,0.4)] px-3 py-1 text-[13px] font-medium uppercase tracking-[0.15em] text-[rgba(255,140,140,0.7)]">
            The search engine
          </span>
          <h2 className="font-hero-display mt-4 text-[2.25rem] font-extrabold leading-[1.05] tracking-[-0.03em] text-white md:text-[3.5rem]">
            I know what I want
          </h2>
          <p className="mt-4 text-base leading-[1.7] text-[rgba(255,200,200,0.5)]">
            Describe any visual in plain English or drop a reference image. Get the exact prompt, model,
            and settings to recreate it.
          </p>
          <span className="mt-7 flex w-full items-center justify-center rounded-xl bg-[#dc2626] px-8 py-3.5 text-base font-semibold tracking-[0.02em] text-white transition-transform group-hover:-translate-y-px group-active:scale-[0.97] md:px-10 md:py-4">
            Find my prompt →
          </span>
        </div>
        <span className="absolute bottom-4 right-4 z-[30] text-xs text-[rgba(255,120,120,0.3)] md:bottom-6 md:right-6">
          {promptsIndexed.toLocaleString()} prompts indexed
        </span>
      </Link>

      {/* Mobile divider + or */}
      <div className="relative z-[40] flex h-14 shrink-0 items-center justify-center bg-[#060606] md:hidden">
        <div className="absolute inset-x-4 top-1/2 h-px -translate-y-1/2 bg-white/[0.06]" />
        <OrBadge mobile className="relative z-[40]" />
      </div>

      {/* Desktop vertical divider + or */}
      <div className="relative z-[40] hidden w-px shrink-0 self-stretch bg-white/[0.06] md:block md:min-h-[calc(90vh-3.5rem)]">
        <div className="absolute left-1/2 top-1/2 z-[40] -translate-x-1/2 -translate-y-1/2">
          <OrBadge />
        </div>
      </div>

      {/* Right pane — builder */}
      <Link
        href="/builder"
        className="group relative z-[20] flex min-h-[45vh] flex-1 flex-col justify-center px-6 py-10 transition-[flex] duration-500 ease-in-out hover:flex-[1.12] md:min-h-0 md:py-16 md:hover:flex-[1.12] active:scale-[0.995]"
      >
        <div
          className="pointer-events-none absolute inset-0 z-[2]"
          style={{
            background:
              'linear-gradient(160deg, rgba(10,10,10,0.7) 0%, rgba(8,8,8,0.85) 50%, rgba(6,6,6,0.93) 85%)',
          }}
        />
        <div className="relative z-[30] mr-auto flex w-full max-w-[440px] flex-col pl-8 pr-6 md:pl-12 md:pr-8">
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
                <div key={label} className="flex items-center gap-2.5 text-sm">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] ${
                      active
                        ? 'border border-white/50 bg-white/[0.08] font-medium text-white'
                        : 'border border-white/[0.12] text-white/40'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className={active ? 'font-medium text-white' : 'text-white/40'}>{label}</span>
                </div>
              )
            })}
          </div>
          <div className="mt-5 flex flex-wrap gap-1.5">
            {[
              { label: 'Flux Pro', color: '#a78bfa' },
              { label: 'SDXL', color: '#34d399' },
              { label: 'Nano 2', color: '#f59e0b' },
              { label: 'Soul V2', color: '#f472b6' },
            ].map(({ label, color }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-2xl border border-white/[0.08] py-1.5 pl-2.5 pr-3.5 text-[11px] text-white/30 transition-colors hover:border-white/25"
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
                {label}
              </span>
            ))}
          </div>
          <span className="mt-7 w-fit rounded-[20px] border border-white/20 px-3 py-1 text-[13px] font-medium uppercase tracking-[0.15em] text-white/50">
            The prompt laboratory
          </span>
          <h2 className="font-hero-display mt-4 text-[2.25rem] font-extrabold leading-[1.05] tracking-[-0.03em] text-white md:text-[3.5rem]">
            Help me figure it out
          </h2>
          <p className="mt-4 text-base leading-[1.7] text-white/45">
            Don&apos;t know what you need? We&apos;ll narrow it down together. Pick options, see real
            results at every step.
          </p>
          <span className="mt-7 flex w-full items-center justify-center rounded-xl bg-white px-8 py-3.5 text-base font-semibold tracking-[0.02em] text-[#0a0a0a] transition-transform group-hover:-translate-y-px group-active:scale-[0.97] md:px-10 md:py-4">
            Start building →
          </span>
        </div>
        <span className="absolute bottom-4 right-4 z-[30] text-xs text-white/[0.18] md:bottom-6 md:right-6">
          5 steps to your prompt
        </span>
      </Link>
    </section>
  )
}
