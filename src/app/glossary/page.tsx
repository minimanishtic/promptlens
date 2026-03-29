import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import GlossarySearch from '@/components/GlossarySearch'
import { NavAuthButton } from '@/components/UserMenu'
import MobileNav from '@/components/MobileNav'

export default function GlossaryPage() {
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
            <Link href="/browse" className="hover:text-white transition-colors">Browse</Link>
            <Link href="/search" className="hover:text-white transition-colors">Search</Link>
            <Link href="/glossary" className="text-white font-medium">Glossary</Link>
            <Link href="/analytics" className="hover:text-white transition-colors">Analytics</Link>
            <Link href="/templates" className="hover:text-white transition-colors">Templates</Link>
            <Link href="/builder" className="hover:text-white transition-colors">Builder</Link>
            <Link href="/library" className="hover:text-white transition-colors">Library</Link>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <NavAuthButton />
            <MobileNav />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-zinc-800/50 bg-gradient-to-b from-zinc-900/60 to-transparent">
        <div className="max-w-screen-xl mx-auto px-4 py-14 sm:py-20">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-sky-400" />
            </div>
            <span className="text-xs font-bold text-sky-400 uppercase tracking-widest">Settings Decoder</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
            What does it actually look like?
          </h1>
          <p className="text-zinc-400 text-base sm:text-lg max-w-2xl leading-relaxed">
            Don&apos;t know what &ldquo;anamorphic&rdquo; or &ldquo;golden hour&rdquo; means? See what every setting actually looks like &mdash; powered by real community generations.
          </p>

          {/* Quick-jump pills */}
          <div className="flex flex-wrap gap-2 mt-8">
            {['Visual Style', 'Lighting', 'Mood', 'Composition', 'Camera Simulation'].map((cat) => (
              <a
                key={cat}
                href={`#${cat.toLowerCase().replace(/\s+/g, '-')}`}
                className="text-xs px-3 py-1.5 rounded-full border border-zinc-700 text-zinc-400 hover:border-sky-500 hover:text-sky-300 transition-colors"
              >
                {cat}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-screen-xl mx-auto px-4 py-10">
        <GlossarySearch />
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
          <span>Powered by community data from multiple AI platforms</span>
          <div className="flex items-center flex-wrap gap-x-4 gap-y-2 justify-center">
            <Link href="/browse" className="hover:text-zinc-300 transition-colors">Browse</Link>
            <Link href="/glossary" className="hover:text-zinc-300 transition-colors">Glossary</Link>
            <Link href="/terms" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Terms</Link>
            <Link href="/privacy" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
