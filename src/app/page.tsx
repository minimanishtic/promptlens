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
      className="group relative overflow-hidden rounded-xl bg-zinc-900 aspect-[3/4] block"
    >
      {thumbnail ? (
        <Image
          src={thumbnail}
          alt={name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105 brightness-[0.45] group-hover:brightness-[0.55]"
          unoptimized
          sizes="(max-width: 640px) 50vw, 25vw"
        />
      ) : (
        <div className="absolute inset-0 bg-zinc-800" />
      )}
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-3 sm:p-4">
        <p className="text-white font-semibold text-sm leading-tight">{name}</p>
        <p className="text-zinc-400 text-xs mt-0.5">{count.toLocaleString()} images</p>
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
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[600px] h-[300px] bg-sky-500/8 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-screen-xl mx-auto px-4 pt-12 pb-8 sm:pt-16 sm:pb-10 flex flex-col items-center text-center">
          <div className="flex items-center gap-2 bg-zinc-800/80 border border-zinc-700/60 text-zinc-300 text-xs px-3 py-1.5 rounded-full mb-5">
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            6,846 real community images · indexed &amp; classified
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-3 leading-[1.08]">
            Prompt<span className="text-sky-400">Lens</span>
          </h1>
          <p className="text-lg sm:text-xl text-zinc-400 font-medium mb-3">
            Stop guessing. Start directing.
          </p>
          <p className="text-zinc-500 text-sm sm:text-base max-w-lg mb-7 leading-relaxed">
            Browse 6,800+ AI-generated images. Find the exact prompt, model, and settings that produce the results you want.
          </p>

          <HeroSearch />
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="max-w-screen-xl mx-auto px-4 pb-12 sm:pb-16">
        <div className="flex items-center justify-between gap-4 mb-5">
          <h2 className="text-lg font-semibold text-white tracking-tight">Browse by Category</h2>
          <Link href="/browse" className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-1 shrink-0">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {/* Portrait tiles — same style as trending cards, 4 cols on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4">
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
      <section className="py-12 border-t border-zinc-800/50">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-white tracking-tight">Trending Generations</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Highest viewed from the community</p>
            </div>
            <Link
              href="/browse"
              className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-1 shrink-0"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

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
