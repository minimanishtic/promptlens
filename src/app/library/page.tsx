import Link from 'next/link'
import { BookMarked } from 'lucide-react'
import LibraryClient from '@/components/LibraryClient'
import { NavAuthButton } from '@/components/UserMenu'
import MobileNav from '@/components/MobileNav'

export default function LibraryPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center gap-4">
          <a href="/" className="text-lg font-bold text-white shrink-0">
            Prompt<span className="text-violet-500">Lens</span>
          </a>
          <span className="text-zinc-700 hidden sm:block">|</span>
          <nav className="hidden sm:flex items-center gap-4 text-sm text-zinc-400 flex-1">
            <Link href="/browse"    className="hover:text-white transition-colors">Browse</Link>
            <Link href="/glossary"  className="hover:text-white transition-colors">Glossary</Link>
            <Link href="/analytics" className="hover:text-white transition-colors">Analytics</Link>
            <Link href="/templates" className="hover:text-white transition-colors">Templates</Link>
            <Link href="/builder"   className="hover:text-white transition-colors">Builder</Link>
            <Link href="/library"   className="text-white font-medium">Library</Link>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <NavAuthButton />
            <MobileNav />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-zinc-800/50 bg-gradient-to-b from-zinc-900/60 to-transparent">
        <div className="max-w-screen-xl mx-auto px-4 py-10 sm:py-14">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-violet-600/15 border border-violet-600/20 flex items-center justify-center">
              <BookMarked className="w-5 h-5 text-violet-400" />
            </div>
            <span className="text-xs font-bold text-violet-400 uppercase tracking-widest">My Library</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 tracking-tight">
            Your saved prompts
          </h1>
          <p className="text-zinc-400 text-base sm:text-lg max-w-2xl leading-relaxed">
            Organise and revisit the AI image prompts that inspire you most.
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-screen-xl mx-auto px-4 py-10">
        <LibraryClient />
      </div>

      {/* Footer */}
      <footer className="mt-10 border-t border-zinc-800/60 py-8">
        <div className="max-w-screen-xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
          <div className="flex items-center gap-1.5">
            <span>Built by</span>
            <a href="https://konvert.media" target="_blank" rel="noopener noreferrer" className="text-zinc-300 hover:text-white transition-colors font-medium">
              Konvert Media
            </a>
          </div>
          <span>Powered by Higgsfield AI community data</span>
          <div className="flex items-center gap-4">
            <Link href="/browse"    className="hover:text-zinc-300 transition-colors">Browse</Link>
            <Link href="/library"   className="hover:text-zinc-300 transition-colors">Library</Link>
            <Link href="/analytics" className="hover:text-zinc-300 transition-colors">Analytics</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
