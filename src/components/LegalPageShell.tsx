import Link from 'next/link'
import { NavAuthButton } from '@/components/UserMenu'
import MobileNav from '@/components/MobileNav'

export default function LegalPageShell({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/" className="text-lg font-bold text-white shrink-0">
            Pro<span className="text-sky-400">mere</span>
          </Link>
          <span className="text-zinc-700 hidden sm:block">|</span>
          <nav className="hidden sm:flex items-center gap-4 text-sm text-zinc-400">
            <Link href="/browse" className="hover:text-white transition-colors">
              Browse
            </Link>
            <Link href="/search" className="hover:text-white transition-colors">
              Search
            </Link>
            <Link href="/glossary" className="hover:text-white transition-colors">
              Glossary
            </Link>
            <Link href="/analytics" className="hover:text-white transition-colors">
              Analytics
            </Link>
            <Link href="/templates" className="hover:text-white transition-colors">
              Templates
            </Link>
            <Link href="/builder" className="hover:text-white transition-colors">
              Builder
            </Link>
            <Link href="/library" className="hover:text-white transition-colors">
              Library
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <NavAuthButton />
            <MobileNav />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12">
        <Link
          href="/"
          className="text-sm text-zinc-400 hover:text-white transition-colors inline-flex items-center gap-1 mb-8"
        >
          ← Back to Promere
        </Link>
        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-10">{title}</h1>
        <div className="space-y-12">{children}</div>

        <footer className="mt-16 pt-8 border-t border-zinc-800 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-zinc-500">
          <Link href="/terms" className="hover:text-zinc-300 transition-colors">
            Terms
          </Link>
          <span aria-hidden className="text-zinc-700">
            ·
          </span>
          <Link href="/privacy" className="hover:text-zinc-300 transition-colors">
            Privacy
          </Link>
        </footer>
      </main>
    </div>
  )
}
