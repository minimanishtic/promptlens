import Link from 'next/link'
import TopNav from '@/components/TopNav'
import WizardClient from '@/components/builder/WizardClient'

export default function BuilderPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <TopNav />

      <section className="max-h-[120px] border-b border-zinc-800/50">
        <div className="max-w-screen-xl mx-auto px-4 py-2">
          <p className="text-[12px] font-bold uppercase tracking-widest text-[#dc2626] mb-1">
            Prompt Builder
          </p>
          <h1 className="text-[28px] font-bold text-white leading-tight tracking-tight">
            Build your perfect prompt
          </h1>
          <p className="text-[14px] text-zinc-400 max-w-xl leading-snug line-clamp-1 mt-0.5">
            Real examples at every step — we surface top prompts that match your choices.
          </p>
        </div>
      </section>

      <div className="max-w-screen-xl mx-auto px-4 py-8">
        <WizardClient />
      </div>

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
            <Link href="/browse" className="hover:text-zinc-300 transition-colors">
              Browse
            </Link>
            <Link href="/glossary" className="hover:text-zinc-300 transition-colors">
              Glossary
            </Link>
            <Link href="/analytics" className="hover:text-zinc-300 transition-colors">
              Analytics
            </Link>
            <Link href="/templates" className="hover:text-zinc-300 transition-colors">
              Templates
            </Link>
            <Link href="/builder" className="hover:text-zinc-300 transition-colors">
              Builder
            </Link>
            <Link href="/terms" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
