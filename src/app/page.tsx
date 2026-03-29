import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Eye, ArrowRight, ChevronDown } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import type { Generation } from '@/types/database'
import type { Database } from '@/types/database'
import { MODEL_DISPLAY_NAMES } from '@/types/database'
import { KNOWN_PRIMARY_CATEGORIES } from '@/lib/primary-categories'
import { generationThumbnailUrl } from '@/lib/generation-image-url'
import { GENERATION_GRID_SELECT } from '@/lib/generation-grid-select'
import TopNav from '@/components/TopNav'
import SplitHero from '@/components/SplitHero'

const db = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

export const metadata: Metadata = {
  title: 'PromptLens — Visual Prompt Intelligence',
  description:
    'Browse 6,800+ AI-generated images across multiple platforms. Stop guessing — find the exact prompt, model, and settings that produce the results you want.',
  openGraph: {
    title: 'PromptLens — Visual Prompt Intelligence',
    description:
      'Browse 6,800+ AI-generated images. Find the exact prompt, model, and settings.',
    url: 'https://promptlens-two.vercel.app',
  },
}

export const dynamic = 'force-dynamic'

async function getHeroBackgroundImages(): Promise<string[]> {
  const { data } = await db
    .from('generations')
    .select('output_image_url_min, output_image_url')
    .eq('source', 'original')
    .lt('sort_priority', 100)
    .limit(200)

  const rows = (data ?? []) as Pick<Generation, 'output_image_url_min' | 'output_image_url'>[]
  let urls = rows
    .map((r) => generationThumbnailUrl(r))
    .filter((u): u is string => Boolean(u))

  for (let i = urls.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[urls[i], urls[j]] = [urls[j], urls[i]]
  }

  if (urls.length === 0) return []
  const out: string[] = []
  for (let i = 0; i < 32; i++) out.push(urls[i % urls.length])
  return out
}

async function getIndexedPromptCount(): Promise<number> {
  const { count } = await db
    .from('generations')
    .select('id', { count: 'exact', head: true })
    .eq('has_prompt', true)
  return count ?? 0
}

async function getTrendingImages(): Promise<Generation[]> {
  const { data } = await db
    .from('generations')
    .select(GENERATION_GRID_SELECT)
    .order('sort_priority', { ascending: true })
    .order('views_count', { ascending: false })
    .limit(12)
  return (data as Generation[]) ?? []
}

async function getCategoryData(): Promise<
  { name: string; count: number; thumbnail: string | null }[]
> {
  const results = await Promise.all(
    KNOWN_PRIMARY_CATEGORIES.map(async (name) => {
      const [countRes, thumbRes] = await Promise.all([
        db
          .from('generations')
          .select('id', { count: 'exact', head: true })
          .eq('primary_category', name),
        db
          .from('generations')
          .select('output_image_url_min, output_image_url')
          .eq('primary_category', name)
          .order('sort_priority', { ascending: true })
          .order('views_count', { ascending: false })
          .limit(1)
          .single(),
      ])

      const count = countRes.count ?? 0
      const thumbData = thumbRes.data as {
        output_image_url_min: string | null
        output_image_url: string | null
      } | null
      const thumbnail = thumbData ? generationThumbnailUrl(thumbData) : null

      return { name, count, thumbnail }
    }),
  )

  return results.sort((a, b) => b.count - a.count)
}

function TrendingCard({ image }: { image: Generation }) {
  const thumbnail = generationThumbnailUrl(image)
  const modelLabel = image.model ? (MODEL_DISPLAY_NAMES[image.model] ?? image.model) : null

  return (
    <Link
      href={`/image/${image.job_set_id}`}
      className="group shrink-0 w-[11.5rem] sm:w-52 md:w-56 lg:w-60 block transition-transform duration-300 hover:-translate-y-0.5"
    >
      <div className="relative overflow-hidden rounded-lg bg-zinc-900 aspect-[3/4] shadow-lg shadow-black/40 ring-1 ring-zinc-800/80 transition-shadow duration-300 group-hover:shadow-xl group-hover:shadow-black/50 group-hover:ring-zinc-700/80">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={image.prompt ?? 'AI generated image'}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            unoptimized
            sizes="(max-width: 640px) 184px, (max-width: 1024px) 208px, 240px"
          />
        ) : (
          <div className="absolute inset-0 bg-zinc-800" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1">
          {modelLabel && (
            <span className="block text-[11px] font-semibold text-white/95 bg-black/35 backdrop-blur-sm rounded px-2 py-0.5 w-fit">
              {modelLabel}
            </span>
          )}
          {image.views_count != null && (
            <span className="flex items-center gap-1 text-[11px] text-white/75">
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
      className="group block w-full min-w-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded-lg"
    >
      <div className="relative w-full aspect-[4/3] overflow-hidden rounded-lg bg-zinc-900 shadow-md shadow-black/30 ring-1 ring-zinc-800/70 transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl group-hover:shadow-black/45 group-hover:ring-zinc-700/60">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            unoptimized
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 34vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 bg-zinc-800" />
        )}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 top-[55%] bg-gradient-to-t from-black via-black/75 to-transparent"
          aria-hidden
        />

        <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end p-4 sm:p-5 text-left">
          <p className="text-white font-semibold text-base sm:text-lg leading-snug line-clamp-3 sm:line-clamp-none">
            {name}
          </p>
          <p className="text-sm text-zinc-400 mt-1">{count.toLocaleString()} images</p>
        </div>
      </div>
    </Link>
  )
}

export default async function HomePage() {
  const [trendingImages, categories, bgUrls, promptsIndexed] = await Promise.all([
    getTrendingImages(),
    getCategoryData(),
    getHeroBackgroundImages(),
    getIndexedPromptCount(),
  ])

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <TopNav />

      <SplitHero bgUrls={bgUrls} promptsIndexed={promptsIndexed} />

      {/* Below hero */}
      <div className="bg-[#0a0a0a]">
        <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-10 sm:px-6">
          <p className="flex items-center gap-2 text-sm text-white/30">
            Or just browse
            <ChevronDown className="h-4 w-4 text-white/25" aria-hidden />
          </p>
        </div>

        <section className="w-full pb-14 sm:pb-20">
          <div className="mx-auto max-w-7xl w-full px-4 sm:px-6">
            <div className="mb-4 flex items-end justify-between gap-4 sm:mb-5">
              <h2 className="text-left text-xl font-semibold tracking-tight text-white sm:text-2xl">
                Browse by Category
              </h2>
              <Link
                href="/browse"
                className="flex shrink-0 items-center gap-1 pb-0.5 text-sm text-zinc-400 transition-colors hover:text-white"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {categories.slice(0, 8).map((cat) => (
                <CategoryCard
                  key={cat.name}
                  name={cat.name}
                  count={cat.count}
                  thumbnail={cat.thumbnail}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-zinc-800/50 py-10 sm:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mb-3 flex items-end justify-between gap-4">
              <div className="text-left">
                <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">Trending</h2>
                <p className="mt-1 text-xs text-zinc-500 sm:text-sm">Highest viewed from the community</p>
              </div>
              <Link
                href="/browse"
                className="flex shrink-0 items-center gap-1 pb-0.5 text-sm text-zinc-400 transition-colors hover:text-white"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-4 scrollbar-thin snap-x snap-mandatory sm:mx-0 sm:gap-4 sm:px-0">
              {trendingImages.map((image) => (
                <div key={image.id} className="snap-start">
                  <TrendingCard image={image} />
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="mt-auto border-t border-zinc-800/50 py-8">
          <div className="mx-auto flex max-w-screen-xl flex-col items-center justify-between gap-3 px-4 text-xs text-zinc-600 sm:flex-row">
            <div className="flex items-center gap-1.5">
              <span>Built by</span>
              <a
                href="https://konvert.media"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-zinc-400 transition-colors hover:text-white"
              >
                Konvert Media
              </a>
            </div>
            <span className="text-center text-zinc-700 sm:text-left">
              Powered by community data from multiple AI platforms
            </span>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              <Link href="/browse" className="transition-colors hover:text-zinc-300">
                Browse
              </Link>
              <Link href="/glossary" className="transition-colors hover:text-zinc-300">
                Glossary
              </Link>
              <Link href="/analytics" className="transition-colors hover:text-zinc-300">
                Analytics
              </Link>
              <Link href="/templates" className="transition-colors hover:text-zinc-300">
                Templates
              </Link>
              <Link href="/builder" className="transition-colors hover:text-zinc-300">
                Builder
              </Link>
              <Link href="/library" className="transition-colors hover:text-zinc-300">
                Library
              </Link>
              <Link href="/terms" className="text-xs text-zinc-500 transition-colors hover:text-zinc-300">
                Terms
              </Link>
              <Link href="/privacy" className="text-xs text-zinc-500 transition-colors hover:text-zinc-300">
                Privacy
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
