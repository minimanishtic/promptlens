import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Eye, ArrowRight, Layers } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { NavAuthButton } from '@/components/UserMenu'
import type { Generation } from '@/types/database'
import { MODEL_DISPLAY_NAMES } from '@/types/database'
import HeroSearch from '@/components/HeroSearch'

export const metadata: Metadata = {
  title: 'PromptLens — Visual Prompt Intelligence',
  description:
    'Browse 6,846 real AI-generated images. Stop guessing — find the exact prompt, model, and settings that produce the results you want.',
  openGraph: {
    title: 'PromptLens — Visual Prompt Intelligence',
    description:
      'Browse 6,846 real AI-generated images. Find the exact prompt, model, and settings.',
    url: 'https://promptlens.vercel.app',
  },
}

export const dynamic = 'force-dynamic'

// ─── data fetching ────────────────────────────────────────────────────────────

async function getTrendingImages(): Promise<Generation[]> {
  const { data } = await supabase
    .from('generations')
    .select('*')
    .order('views_count', { ascending: false })
    .limit(12)
  return (data as Generation[]) ?? []
}

async function getCategoryData(): Promise<
  { name: string; count: number; thumbnail: string | null }[]
> {
  // Get categories with counts from the generations table directly
  const { data: catRows } = await supabase
    .from('generations')
    .select('primary_category')
    .not('primary_category', 'is', null)

  if (!catRows) return []

  const counts: Record<string, number> = {}
  for (const row of catRows as { primary_category: string | null }[]) {
    const c = row.primary_category
    if (c) counts[c] = (counts[c] ?? 0) + 1
  }

  // Fetch one representative image per category in parallel
  const categories = Object.entries(counts).sort((a, b) => b[1] - a[1])

  const withThumbs = await Promise.all(
    categories.map(async ([name, count]) => {
      const { data } = await supabase
        .from('generations')
        .select('output_image_url_min, output_image_url')
        .eq('primary_category', name)
        .order('views_count', { ascending: false })
        .limit(1)
        .single()

      const thumbnail =
        (data as { output_image_url_min: string | null; output_image_url: string | null } | null)
          ?.output_image_url_min ??
        (data as { output_image_url_min: string | null; output_image_url: string | null } | null)
          ?.output_image_url ??
        null

      return { name, count, thumbnail }
    }),
  )

  return withThumbs
}

// ─── sub-components ───────────────────────────────────────────────────────────

function TrendingCard({ image }: { image: Generation }) {
  const thumbnail = image.output_image_url_min ?? image.output_image_url
  const modelLabel = image.model ? (MODEL_DISPLAY_NAMES[image.model] ?? image.model) : null

  return (
    <Link
      href={`/image/${image.job_set_id}`}
      className="group shrink-0 w-44 sm:w-48 block"
    >
      <div className="relative overflow-hidden rounded-xl bg-zinc-900 aspect-[3/4]">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={image.prompt ?? 'AI generated image'}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            unoptimized
            sizes="192px"
          />
        ) : (
          <div className="absolute inset-0 bg-zinc-800" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-2.5 space-y-1">
          {modelLabel && (
            <span className="block text-[10px] font-semibold text-white/90 bg-white/10 backdrop-blur-sm rounded px-1.5 py-0.5 w-fit">
              {modelLabel}
            </span>
          )}
          {image.views_count != null && (
            <span className="flex items-center gap-1 text-[10px] text-white/70">
              <Eye className="w-3 h-3" />
              {image.views_count >= 1000
                ? `${(image.views_count / 1000).toFixed(1)}k`
                : image.views_count}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

function CategoryCard({
  name,
  count,
  thumbnail,
}: {
  name: string
  count: number
  thumbnail: string | null
}) {
  return (
    <Link
      href={`/browse?category=${encodeURIComponent(name)}`}
      className="group relative overflow-hidden rounded-2xl bg-zinc-900 aspect-[4/3] block"
    >
      {thumbnail && (
        <Image
          src={thumbnail}
          alt={name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105 brightness-50 group-hover:brightness-60"
          unoptimized
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
      )}
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-4">
        <p className="text-white font-semibold text-sm leading-tight">{name}</p>
        <p className="text-zinc-400 text-xs mt-1">{count.toLocaleString()} images</p>
      </div>

      {/* Hover arrow */}
      <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0">
        <ArrowRight className="w-3.5 h-3.5 text-white" />
      </div>
    </Link>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const [trendingImages, categories] = await Promise.all([
    getTrendingImages(),
    getCategoryData(),
  ])

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Nav */}
      <header className="border-b border-zinc-800/60">
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-lg font-bold">
            Prompt<span className="text-violet-500">Lens</span>
          </span>
          <nav className="flex items-center gap-5">
            <Link href="/browse" className="text-sm text-zinc-400 hover:text-white transition-colors hidden sm:block">
              Browse
            </Link>
            <Link href="/glossary" className="text-sm text-zinc-400 hover:text-white transition-colors hidden sm:block">
              Glossary
            </Link>
            <Link href="/analytics" className="text-sm text-zinc-400 hover:text-white transition-colors hidden sm:block">
              Analytics
            </Link>
            <Link href="/templates" className="text-sm text-zinc-400 hover:text-white transition-colors hidden sm:block">
              Templates
            </Link>
            <Link href="/builder" className="text-sm text-zinc-400 hover:text-white transition-colors hidden sm:block">
              Builder
            </Link>
            <Link
              href="/browse"
              className="text-sm bg-violet-600 hover:bg-violet-500 text-white px-4 py-1.5 rounded-lg transition-colors hidden sm:block"
            >
              Explore images
            </Link>
            <NavAuthButton />
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-screen-xl mx-auto px-4 pt-24 pb-20 flex flex-col items-center text-center">
          {/* Badge */}
          <div className="flex items-center gap-2 bg-violet-600/10 border border-violet-600/20 text-violet-300 text-xs px-3 py-1.5 rounded-full mb-6">
            <Layers className="w-3.5 h-3.5" />
            6,846 real community images · indexed &amp; classified
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-4 leading-[1.1]">
            Prompt<span className="text-violet-500">Lens</span>
          </h1>
          <p className="text-xl sm:text-2xl text-zinc-300 font-medium mb-4">
            Stop guessing. Start directing.
          </p>
          <p className="text-zinc-500 text-base sm:text-lg max-w-xl mb-10 leading-relaxed">
            Browse 6,800+ AI-generated images. Find the exact prompt, model, and settings that produce the results you want.
          </p>

          <HeroSearch />
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="max-w-screen-xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Browse by Category</h2>
          <Link href="/browse" className="text-sm text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {categories.slice(0, 8).map((cat) => (
            <CategoryCard
              key={cat.name}
              name={cat.name}
              count={cat.count}
              thumbnail={cat.thumbnail}
            />
          ))}
        </div>
      </section>

      {/* ── Trending ── */}
      <section className="py-16 border-t border-zinc-800/50">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white">Trending Generations</h2>
              <p className="text-xs text-zinc-500 mt-1">Highest viewed images from the community</p>
            </div>
            <Link
              href="/browse"
              className="text-sm text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1 shrink-0"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Horizontal scroll */}
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-thin snap-x snap-mandatory">
            {trendingImages.map((image) => (
              <div key={image.id} className="snap-start">
                <TrendingCard image={image} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="mt-auto border-t border-zinc-800/60 py-8">
        <div className="max-w-screen-xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
          <div className="flex items-center gap-1.5">
            <span>Built by</span>
            <a
              href="https://konvert.media"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-300 hover:text-white transition-colors font-medium"
            >
              Konvert Media
            </a>
          </div>
          <span>Powered by Higgsfield AI community data</span>
          <div className="flex items-center gap-4">
            <Link href="/browse" className="hover:text-zinc-300 transition-colors">Browse</Link>
            <Link href="/glossary" className="hover:text-zinc-300 transition-colors">Glossary</Link>
            <Link href="/analytics" className="hover:text-zinc-300 transition-colors">Analytics</Link>
            <Link href="/templates" className="hover:text-zinc-300 transition-colors">Templates</Link>
            <Link href="/builder" className="hover:text-zinc-300 transition-colors">Builder</Link>
            <Link href="/library" className="hover:text-zinc-300 transition-colors">Library</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
