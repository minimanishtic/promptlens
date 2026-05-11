import Link from 'next/link'
import { NavAuthButton } from '@/components/UserMenu'
import MobileNav from '@/components/MobileNav'

const LINKS = [
  { href: '/browse', label: 'Browse' },
  { href: '/glossary', label: 'Glossary' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/templates', label: 'Templates' },
  { href: '/docs/api', label: 'API Docs' },
] as const

export default function TopNav() {
  return (
    <header className="sticky top-0 z-50 shrink-0 border-b border-white/[0.06] bg-[#060606]">
      <div className="mx-auto flex h-14 max-w-[100vw] items-center justify-between gap-3 px-4">
        <Link href="/" className="flex items-center gap-2.5 min-w-0">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#dc2626] text-sm font-semibold text-white"
            aria-hidden
          >
            P
          </span>
          <span
            className="truncate text-[15px] font-medium tracking-[0.5px] text-white"
          >
            Promere
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <div className="hidden sm:flex items-center gap-1">
            {LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="px-2.5 py-1.5 text-xs text-white/[0.45] transition-colors hover:text-white/[0.85]"
              >
                {label}
              </Link>
            ))}
          </div>
          <NavAuthButton variant="landing" />
          <MobileNav />
        </nav>
      </div>
    </header>
  )
}
