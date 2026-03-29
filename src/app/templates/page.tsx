import Link from 'next/link'
import { FileText } from 'lucide-react'
import { fetchTemplates, CATEGORIES } from '@/lib/templates'
import TemplatesClient from '@/components/TemplatesClient'
import { NavAuthButton } from '@/components/UserMenu'
import MobileNav from '@/components/MobileNav'

export const dynamic = 'force-dynamic'

export default async function TemplatesPage() {
  const { byCategory, allModels } = await fetchTemplates()

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center gap-4">
          <a href="/" className="text-lg font-bold text-white shrink-0">
            Pro<span className="text-sky-400">mere</span>
          </a>
          <span className="text-zinc-700 hidden sm:block">|</span>
          <nav className="hidden sm:flex items-center gap-4 text-sm text-zinc-400">
            <Link href="/browse"     className="hover:text-white transition-colors">Browse</Link>
            <Link href="/glossary"   className="hover:text-white transition-colors">Glossary</Link>
            <Link href="/analytics"  className="hover:text-white transition-colors">Analytics</Link>
            <Link href="/templates"  className="text-white font-medium">Templates</Link>
            <Link href="/builder"    className="hover:text-white transition-colors">Builder</Link>
            <Link href="/library"    className="hover:text-white transition-colors">Library</Link>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <NavAuthButton />
            <MobileNav />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-zinc-800/50 bg-gradient-to-b from-zinc-900/60 to-transparent">
        <div className="max-w-screen-xl mx-auto px-4 py-12 sm:py-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-sky-400" />
            </div>
            <span className="text-xs font-bold text-sky-400 uppercase tracking-widest">Prompt Templates</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 tracking-tight">
            Proven prompts that work
          </h1>
          <p className="text-zinc-400 text-base sm:text-lg max-w-2xl leading-relaxed">
            The top 5 highest-engagement prompts from each category. Copy, remix, and direct your next generation with confidence.
          </p>

          {/* Quick-jump pills */}
          <div className="flex flex-wrap gap-2 mt-6">
            {CATEGORIES.map((cat) => (
              <a
                key={cat}
                href={`#${cat.replace(/\s+/g, '-').toLowerCase()}`}
                className="text-xs px-3 py-1.5 rounded-full border border-zinc-700 text-zinc-400 hover:border-sky-500/50 hover:text-sky-300 transition-colors"
              >
                {cat}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Main content */}
      <div className="max-w-screen-xl mx-auto px-4 py-10">
        <TemplatesClient allData={byCategory} allModels={allModels} />
      </div>

      {/* Footer */}
      <footer className="mt-10 border-t border-zinc-800/60 py-8">
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
          <span>Powered by community data from multiple AI platforms</span>
          <div className="flex items-center flex-wrap gap-x-4 gap-y-2 justify-center">
            <Link href="/browse" className="hover:text-zinc-300 transition-colors">Browse</Link>
            <Link href="/glossary" className="hover:text-zinc-300 transition-colors">Glossary</Link>
            <Link href="/analytics" className="hover:text-zinc-300 transition-colors">Analytics</Link>
            <Link href="/templates" className="hover:text-zinc-300 transition-colors">Templates</Link>
            <Link href="/terms" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Terms</Link>
            <Link href="/privacy" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
