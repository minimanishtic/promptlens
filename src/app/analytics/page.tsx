import Link from 'next/link'
import { BarChart2, TrendingUp, Image as ImageIcon, Zap, Tag } from 'lucide-react'
import { fetchAllAnalytics } from '@/lib/analytics'
import { NavAuthButton } from '@/components/UserMenu'
import { MODEL_DISPLAY_NAMES } from '@/types/database'
import ModelByCategoryChart from '@/components/charts/ModelByCategoryChart'
import ModelEngagementChart from '@/components/charts/ModelEngagementChart'
import PromptLengthChart from '@/components/charts/PromptLengthChart'
import VisualStyleDonut from '@/components/charts/VisualStyleDonut'
import ReferenceImpactChart from '@/components/charts/ReferenceImpactChart'
import LightingMoodHeatmap from '@/components/charts/LightingMoodHeatmap'

export const dynamic = 'force-dynamic'

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-start gap-4">
      <div className="w-10 h-10 rounded-lg bg-violet-600/15 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-violet-400" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-zinc-500 mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-white leading-none">{value}</p>
        {sub && <p className="text-xs text-zinc-600 mt-1 truncate">{sub}</p>}
      </div>
    </div>
  )
}

// ── Chart card wrapper ────────────────────────────────────────────────────────

function ChartCard({
  title,
  subtitle,
  height = 'h-72',
  children,
}: {
  title: string
  subtitle?: string
  height?: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <h2 className="text-sm font-semibold text-white mb-1">{title}</h2>
      {subtitle && <p className="text-xs text-zinc-500 mb-5">{subtitle}</p>}
      {!subtitle && <div className="mb-4" />}
      <div className={height}>{children}</div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AnalyticsPage() {
  const data = await fetchAllAnalytics()
  const { summary } = data

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
            <Link href="/analytics" className="text-white font-medium">Analytics</Link>
            <Link href="/templates" className="hover:text-white transition-colors">Templates</Link>
            <Link href="/builder" className="hover:text-white transition-colors">Builder</Link>
            <Link href="/library" className="hover:text-white transition-colors">Library</Link>
          </nav>
          <div className="ml-auto">
            <NavAuthButton />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-zinc-800/50 bg-gradient-to-b from-zinc-900/60 to-transparent">
        <div className="max-w-screen-xl mx-auto px-4 py-12 sm:py-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-violet-600/15 border border-violet-600/20 flex items-center justify-center">
              <BarChart2 className="w-5 h-5 text-violet-400" />
            </div>
            <span className="text-xs font-bold text-violet-400 uppercase tracking-widest">Prompt Analytics</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 tracking-tight">
            What actually works?
          </h1>
          <p className="text-zinc-400 text-base sm:text-lg max-w-2xl leading-relaxed">
            Data-driven insights from {summary.totalImages.toLocaleString()} classified AI-generated images.
            Learn which models, styles, and prompt lengths drive the most engagement.
          </p>
        </div>
      </section>

      <div className="max-w-screen-xl mx-auto px-4 py-10 space-y-10">

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard
            icon={ImageIcon}
            label="Total Images"
            value={summary.totalImages.toLocaleString()}
          />
          <StatCard
            icon={Zap}
            label="With Prompts"
            value={summary.totalWithPrompt.toLocaleString()}
            sub={`${Math.round((summary.totalWithPrompt / summary.totalImages) * 100)}% of total`}
          />
          <StatCard
            icon={TrendingUp}
            label="Avg Views"
            value={summary.avgViews.toLocaleString()}
            sub="per generation"
          />
          <StatCard
            icon={BarChart2}
            label="Top Model"
            value={MODEL_DISPLAY_NAMES[summary.topModel] ?? summary.topModel}
            sub="by total views"
          />
          <StatCard
            icon={Tag}
            label="Top Category"
            value={summary.topCategory.split(' ')[0]}
            sub={summary.topCategory}
          />
        </div>

        {/* Row 1: stacked bar + engagement */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            title="Model Distribution by Category"
            subtitle="Which models are used most in each image category"
            height="h-80"
          >
            <ModelByCategoryChart data={data.modelByCategory} />
          </ChartCard>
          <ChartCard
            title="Avg Engagement by Model"
            subtitle="Average views per generation, sorted by performance"
            height="h-80"
          >
            <ModelEngagementChart data={data.modelEngagement} />
          </ChartCard>
        </div>

        {/* Row 2: prompt length + donut */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            title="Optimal Prompt Length"
            subtitle="Average views by prompt character count range. Bar opacity = image volume."
            height="h-64"
          >
            <PromptLengthChart data={data.promptLengthBuckets} />
          </ChartCard>
          <ChartCard
            title="Visual Style Distribution"
            subtitle="Breakdown of all images by classified visual style"
            height="h-64"
          >
            <VisualStyleDonut data={data.visualStyleDist} />
          </ChartCard>
        </div>

        {/* Row 3: reference impact full width */}
        <ChartCard
          title="Reference Image Impact on Engagement"
          subtitle="Average views for generations with vs without reference images, by category"
          height="h-72"
        >
          <ReferenceImpactChart data={data.referenceImpact} />
        </ChartCard>

        {/* Row 4: heatmap full width */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-1">Lighting &times; Mood Heatmap</h2>
          <p className="text-xs text-zinc-500 mb-6">
            Number of images at each lighting + mood combination. Darker = more images.
          </p>
          <LightingMoodHeatmap data={data.heatmap} />
        </div>

      </div>

      {/* Footer */}
      <footer className="mt-16 border-t border-zinc-800/60 py-8">
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
