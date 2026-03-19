import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Eye, Heart, ImageIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Generation } from '@/types/database'
import { MODEL_DISPLAY_NAMES } from '@/types/database'
import CopyPromptButton from '@/components/CopyPromptButton'
import ImageCard from '@/components/ImageCard'

// ─── helpers ────────────────────────────────────────────────────────────────

function parseReferenceUrls(raw: unknown): string[] {
  if (!raw) return []

  // Already an array
  if (Array.isArray(raw)) return raw.filter((u): u is string => typeof u === 'string')

  if (typeof raw === 'string') {
    // Might be a plain URL
    if (raw.startsWith('http')) return [raw]
    // Try JSON parse (handles double-escaped strings too)
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.filter((u): u is string => typeof u === 'string')
      if (typeof parsed === 'string') {
        // double-escaped — parse again
        try {
          const inner = JSON.parse(parsed)
          if (Array.isArray(inner)) return inner.filter((u): u is string => typeof u === 'string')
        } catch { /* ignore */ }
      }
    } catch { /* ignore */ }
  }

  // Object with values
  if (typeof raw === 'object') {
    return Object.values(raw as Record<string, unknown>).filter(
      (v): v is string => typeof v === 'string',
    )
  }

  return []
}

function formatNumber(n: number | null): string {
  if (n == null) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return n.toLocaleString()
}

// ─── sub-components ──────────────────────────────────────────────────────────

function Tag({ label, color = 'default' }: { label: string; color?: 'violet' | 'blue' | 'amber' | 'default' }) {
  const styles = {
    violet: 'bg-violet-600/20 text-violet-300 border-violet-600/30',
    blue: 'bg-blue-600/20 text-blue-300 border-blue-600/30',
    amber: 'bg-amber-600/20 text-amber-300 border-amber-600/30',
    default: 'bg-zinc-700/60 text-zinc-300 border-zinc-600/40',
  }
  return (
    <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full border ${styles[color]}`}>
      {label}
    </span>
  )
}

function MetaRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value == null || value === '') return null
  return (
    <div className="flex gap-3 py-2 border-b border-zinc-800/60 last:border-0">
      <span className="text-xs text-zinc-500 w-28 shrink-0 pt-0.5">{label}</span>
      <span className="text-xs text-zinc-200 break-all">{String(value)}</span>
    </div>
  )
}

// ─── metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ job_set_id: string }>
}): Promise<Metadata> {
  const { job_set_id } = await params
  const { data } = await supabase
    .from('generations')
    .select('prompt, primary_category, visual_style, output_image_url_min, output_image_url')
    .eq('job_set_id', job_set_id)
    .single()

  if (!data) {
    return { title: 'Image Not Found' }
  }

  const gen = data as {
    prompt: string | null
    primary_category: string | null
    visual_style: string | null
    output_image_url_min: string | null
    output_image_url: string | null
  }

  const promptSnippet = gen.prompt
    ? gen.prompt.slice(0, 80) + (gen.prompt.length > 80 ? '…' : '')
    : 'No prompt'
  const category = gen.primary_category ?? 'AI Image'
  const style = gen.visual_style ? ` · ${gen.visual_style}` : ''
  const title = `${category}${style}`
  const imageUrl = gen.output_image_url_min ?? gen.output_image_url ?? undefined

  return {
    title,
    description: promptSnippet,
    openGraph: {
      title,
      description: promptSnippet,
      images: imageUrl ? [{ url: imageUrl }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: promptSnippet,
      images: imageUrl ? [imageUrl] : [],
    },
  }
}

// ─── page ────────────────────────────────────────────────────────────────────

export default async function ImageDetailPage({
  params,
}: {
  params: Promise<{ job_set_id: string }>
}) {
  const { job_set_id } = await params

  const { data: image, error } = await supabase
    .from('generations')
    .select('*')
    .eq('job_set_id', job_set_id)
    .single()

  if (error || !image) notFound()

  const gen = image as Generation

  // Fetch similar images in parallel
  let similarImages: Generation[] = []
  if (gen.primary_category || gen.visual_style) {
    let query = supabase
      .from('generations')
      .select('*')
      .neq('job_set_id', job_set_id)
      .order('views_count', { ascending: false })
      .limit(8)

    if (gen.primary_category) query = query.eq('primary_category', gen.primary_category)
    if (gen.visual_style) query = query.eq('visual_style', gen.visual_style)

    const { data } = await query
    if (data) similarImages = data as Generation[]
  }

  const refUrls = parseReferenceUrls(gen.reference_image_urls)
  const modelLabel = gen.model ? (MODEL_DISPLAY_NAMES[gen.model] ?? gen.model) : null
  const dimensions = gen.width && gen.height ? `${gen.width} × ${gen.height}` : null

  const classificationTags: { label: string; color: 'violet' | 'blue' | 'amber' | 'default' }[] = [
    gen.primary_category && { label: gen.primary_category, color: 'violet' as const },
    gen.sub_category && { label: gen.sub_category, color: 'violet' as const },
    gen.visual_style && { label: gen.visual_style, color: 'blue' as const },
    gen.lighting && { label: gen.lighting, color: 'default' as const },
    gen.mood && { label: gen.mood, color: 'amber' as const },
    gen.composition && { label: gen.composition, color: 'default' as const },
    gen.camera_simulation && { label: gen.camera_simulation, color: 'default' as const },
  ].filter(Boolean) as { label: string; color: 'violet' | 'blue' | 'amber' | 'default' }[]

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center gap-4">
          <a href="/" className="text-lg font-bold text-white shrink-0">
            Prompt<span className="text-violet-500">Lens</span>
          </a>
          <span className="text-zinc-700 hidden sm:block">|</span>
          <nav className="hidden sm:flex items-center gap-4 text-sm text-zinc-400">
            <Link href="/browse" className="hover:text-white transition-colors">Browse</Link>
            <Link href="/glossary" className="hover:text-white transition-colors">Glossary</Link>
          </nav>
          <Link
            href="/browse"
            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors sm:hidden"
          >
            <ArrowLeft className="w-4 h-4" />
            Browse
          </Link>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
          {/* ── Left: image + references ── */}
          <div className="space-y-4">
            {/* Main image */}
            <div className="relative w-full rounded-xl overflow-hidden bg-zinc-900">
              {gen.output_image_url ? (
                <Image
                  src={gen.output_image_url}
                  alt={gen.prompt ?? 'AI generated image'}
                  width={gen.width ?? 1080}
                  height={gen.height ?? 1440}
                  className="w-full h-auto object-contain"
                  sizes="(max-width: 768px) 100vw, 60vw"
                  unoptimized
                  priority
                />
              ) : (
                <div className="w-full aspect-[3/4] flex items-center justify-center bg-zinc-800">
                  <ImageIcon className="w-12 h-12 text-zinc-600" />
                </div>
              )}
            </div>

            {/* Reference images */}
            {gen.has_references && refUrls.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                  Reference Images ({refUrls.length})
                </p>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {refUrls.map((url, i) => (
                    <div
                      key={i}
                      className="relative shrink-0 w-28 h-28 rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800"
                    >
                      <Image
                        src={url}
                        alt={`Reference ${i + 1}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right: details panel ── */}
          <div className="space-y-6">
            {/* Engagement */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-zinc-400">
                <Eye className="w-4 h-4" />
                <span className="text-sm font-medium text-zinc-200">{formatNumber(gen.views_count)}</span>
                <span className="text-xs">views</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400">
                <Heart className="w-4 h-4" />
                <span className="text-sm font-medium text-zinc-200">{formatNumber(gen.likes_count)}</span>
                <span className="text-xs">likes</span>
              </div>
              {gen.creator_username && (
                <span className="text-xs text-zinc-500 ml-auto">@{gen.creator_username}</span>
              )}
            </div>

            {/* Prompt */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Prompt</p>
                {gen.prompt && <CopyPromptButton prompt={gen.prompt} />}
              </div>
              <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
                {gen.prompt ?? (
                  <span className="text-zinc-500 italic">No prompt available</span>
                )}
              </p>
            </div>

            {/* Classification tags */}
            {classificationTags.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Classification</p>
                <div className="flex flex-wrap gap-2">
                  {classificationTags.map((t) => (
                    <Tag key={t.label} label={t.label} color={t.color} />
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                Generation Settings
              </p>
              <div>
                <MetaRow label="Model" value={modelLabel} />
                <MetaRow label="Style" value={gen.style_name} />
                <MetaRow label="Style Strength" value={gen.style_strength != null ? gen.style_strength.toFixed(2) : null} />
                <MetaRow label="Quality" value={gen.quality} />
                <MetaRow label="Dimensions" value={dimensions} />
                <MetaRow label="Aspect Ratio" value={gen.aspect_ratio} />
                <MetaRow label="Seed" value={gen.seed} />
                <MetaRow label="Reference Usage" value={gen.reference_usage} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Similar Images ── */}
        {similarImages.length > 0 && (
          <section className="mt-14">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white">Similar Images</h2>
              <Link
                href={`/browse${gen.primary_category ? `?category=${encodeURIComponent(gen.primary_category)}` : ''}`}
                className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-8 gap-3">
              {similarImages.map((img) => (
                <ImageCard
                  key={img.id}
                  image={img}
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 12vw"
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
