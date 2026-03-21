import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Eye, ArrowRight, Layers } from 'lucide-react' // ArrowRight used in section headers
import { createClient } from '@supabase/supabase-js'
import { NavAuthButton } from '@/components/UserMenu'
import MobileNav from '@/components/MobileNav'
import type { Generation } from '@/types/database'
import type { Database } from '@/types/database'
import { MODEL_DISPLAY_NAMES } from '@/types/database'
import HeroSearch from '@/components/HeroSearch'

// Plain server-side client — no cookie handling needed for public reads
const db = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

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
  const { data } = await db
    .from('generations')
    .select('*')
    .order('views_count', { ascending: false })
    .limit(12)
  return (data as Generation[]) ?? []
}

// Hard-coded category list so we never rely on scanning all rows to discover them.
// These are the 8 known primary_category values in the database.
const KNOWN_CATEGORIES = [
  'Portrait & Headshot',
  'Fashion & Editorial',
  'Fantasy & Creative',
  'Cinematic & Film Still',
  'Landscape & Architecture',
  'Street & Documentary',
  'Product Photography',
  'Identity Transform',
]

async function getCategoryData(): Promise<
  { name: string; count: number; thumbnail: string | null }[]
> {
  // Fetch count + top thumbnail for each category in parallel
  const results = await Promise.all(
    KNOWN_CATEGORIES.map(async (name) => {
      const [countRes, thumbRes] = await Promise.all([
        db
          .from('generations')
          .select('id', { count: 'exact', head: true })
          .eq('primary_category', name),
        db
          .from('generations')
          .select('output_image_url_min, output_image_url')
          .eq('primary_category', name)
          .order('views_count', { ascending: false })
          .limit(1)
          .single(),
      ])

      const count = countRes.count ?? 0
      const thumbData = thumbRes.data as {
        output_image_url_min: string | null
        output_image_url: string | null
      } | null
      const thumbnail = thumbData?.output_image_url_min ?? thumbData?.output_image_url ?? null

      return { name, count, thumbnail }
    }),
  )

  // Sort by image count descending so most-populated categories appear first
  return results.sort((a, b) => b.count - a.count)
}

// ─── sub-components ───────────────────────────────────────────────────────────

function TrendingCard({ image }: { image: Generation }) {
  const thumbnail = image.output_image_url_min ?? image.output_image_url
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
      {/*
        Inner box carries aspect-ratio + overflow so grid column width is real layout size.
        (fill Image is position:absolute and does not contribute to min-content width — without
        this, columns can collapse to tiny tracks on some browsers.)
      */}
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
        {/* Bottom ~40% legibility wash */}
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

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const [trendingImages, categories] = await Promise.all([
    getTrendingImages(),
    getCategoryData(),
  ])

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Nav */}
      <header className="border-b border-zinc-800/50 sticky top-0 z-30 bg-zinc-950/90 backdrop-blur-md">
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-lg font-bold tracking-tight">
            Prompt<span className="text-sky-400">Lens</span>
          </span>
          <nav className="flex items-center gap-1">
            {['Browse', 'Glossary', 'Analytics', 'Templates', 'Builder'].map((label) => (
              <Link
                key={label}
                href={`/${label.toLowerCase()}`}
                className="text-sm text-zinc-400 hover:text-white transition-colors hidden sm:block px-3 py-1.5 rounded-md hover:bg-zinc-800/60"
              >
                {label}
              </Link>
            ))}
            <Link
              href="/browse"
              className="text-sm bg-white text-zinc-950 hover:bg-zinc-100 font-semibold px-4 py-1.5 rounded-lg transition-colors hidden sm:block ml-2"
            >
              Explore
            </Link>
            <NavAuthButton />
            <MobileNav />
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden py-16 sm:py-20">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(100%,52rem)] h-[min(70vh,28rem)] bg-sky-500/[0.06] rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 flex flex-col items-center text-center">
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tighter text-white mb-4 sm:mb-5 leading-[0.95]">
            Prompt<span className="text-sky-400">Lens</span>
          </h1>
          <p className="text-2xl sm:text-3xl lg:text-4xl text-zinc-200 font-semibold tracking-tight mb-4 max-w-4xl leading-tight px-1">
            Stop guessing. Start directing.
          </p>
          <p className="text-zinc-500 text-lg sm:text-xl max-w-2xl mb-6 sm:mb-7 leading-relaxed">
            Browse 6,800+ AI-generated images. Find the exact prompt, model, and settings that produce the results you want.
          </p>

          <div className="w-full mb-3 sm:mb-4">
            <HeroSearch />
          </div>
          <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px] sm:text-xs text-zinc-600">
            <Layers className="w-3.5 h-3.5 text-zinc-500 shrink-0" aria-hidden />
            <span>6,846 indexed community images · classified by style, light &amp; mood</span>
          </p>
        </div>
      </section>

      {/* ── Categories (sibling of hero — own full-width band + max-w-7xl inner) ── */}
      <section className="w-full pb-14 sm:pb-20">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between gap-4 mb-4 sm:mb-5">
            <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight text-left">
              Browse by Category
            </h2>
            <Link href="/browse" className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-1 shrink-0 pb-0.5">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
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

      {/* ── Trending ── */}
      <section className="py-10 sm:py-12 border-t border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between gap-4 mb-3">
            <div className="text-left">
              <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">Trending</h2>
              <p className="text-xs sm:text-sm text-zinc-500 mt-1">Highest viewed from the community</p>
            </div>
            <Link
              href="/browse"
              className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-1 shrink-0 pb-0.5"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-thin snap-x snap-mandatory">
            {trendingImages.map((image) => (
              <div key={image.id} className="snap-start">
                <TrendingCard image={image} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="mt-auto border-t border-zinc-800/50 py-8">
        <div className="max-w-screen-xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-600">
          <div className="flex items-center gap-1.5">
            <span>Built by</span>
            <a
              href="https://konvert.media"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-white transition-colors font-medium"
            >
              Konvert Media
            </a>
          </div>
          <span className="text-zinc-700">Powered by Higgsfield AI community data</span>
          <div className="flex items-center flex-wrap gap-x-4 gap-y-2 justify-center">
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
