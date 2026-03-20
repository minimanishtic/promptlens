import Link from 'next/link'
import { Wand2 } from 'lucide-react'
import WizardClient from '@/components/builder/WizardClient'
import { NavAuthButton } from '@/components/UserMenu'
import MobileNav from '@/components/MobileNav'

export default function BuilderPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center gap-4">
          <a href="/" className="text-lg font-bold text-white shrink-0">
            Prompt<span className="text-sky-400">Lens</span>
          </a>
          <span className="text-zinc-700 hidden sm:block">|</span>
          <nav className="hidden sm:flex items-center gap-4 text-sm text-zinc-400">
            <Link href="/browse"     className="hover:text-white transition-colors">Browse</Link>
            <Link href="/glossary"   className="hover:text-white transition-colors">Glossary</Link>
            <Link href="/analytics"  className="hover:text-white transition-colors">Analytics</Link>
            <Link href="/templates"  className="hover:text-white transition-colors">Templates</Link>
            <Link href="/builder"    className="text-white font-medium">Builder</Link>
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
        <div className="max-w-screen-xl mx-auto px-4 py-10 sm:py-14">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/20 flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-sky-400" />
            </div>
            <span className="text-xs font-bold text-sky-400 uppercase tracking-widest">Prompt Builder</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 tracking-tight">
            Build your perfect prompt
          </h1>
          <p className="text-zinc-400 text-base sm:text-lg max-w-2xl leading-relaxed">
            Make visual choices at each step — every option shows real AI-generated examples from the community.
            We&apos;ll find the top-performing prompts that match your exact creative vision.
          </p>
        </div>
      </section>

      {/* Wizard */}
      <div className="max-w-screen-xl mx-auto px-4 py-10">
        <WizardClient />
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
            <Link href="/glossary"  className="hover:text-zinc-300 transition-colors">Glossary</Link>
            <Link href="/analytics" className="hover:text-zinc-300 transition-colors">Analytics</Link>
            <Link href="/templates" className="hover:text-zinc-300 transition-colors">Templates</Link>
            <Link href="/builder"   className="hover:text-zinc-300 transition-colors">Builder</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
