'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, BookMarked, LogOut, User } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const NAV_LINKS = [
  { href: '/browse',    label: 'Browse' },
  { href: '/glossary',  label: 'Glossary' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/templates', label: 'Templates' },
  { href: '/builder',   label: 'Builder' },
  { href: '/library',   label: 'Library' },
]

export default function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { user, loading, signOut, openAuth } = useAuth()
  const drawerRef = useRef<HTMLDivElement>(null)

  const close = () => setOpen(false)

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // Focus trap — keep focus inside drawer when open
  useEffect(() => {
    if (open) drawerRef.current?.focus()
  }, [open])

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <>
      {/* Hamburger button — only visible below sm */}
      <button
        className="sm:hidden flex items-center justify-center w-11 h-11 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm sm:hidden"
          aria-hidden="true"
          onClick={close}
        />
      )}

      {/* Slide-in drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        tabIndex={-1}
        className={`
          fixed top-0 right-0 bottom-0 z-50 w-72 max-w-[calc(100vw-3rem)]
          bg-zinc-950 border-l border-zinc-800/80 flex flex-col
          transition-transform duration-200 ease-out
          sm:hidden
          outline-none
          ${open ? 'translate-x-0 shadow-2xl' : 'translate-x-full'}
        `}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 h-14 border-b border-zinc-800/80 shrink-0">
          <span className="text-base font-bold tracking-tight">
            Pro<span className="text-sky-400">mere</span>
          </span>
          <button
            onClick={close}
            className="flex items-center justify-center w-11 h-11 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-2">
          {NAV_LINKS.map(({ href, label }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={close}
                className={`
                  flex items-center gap-3 px-6 py-4 text-base transition-colors
                  ${active
                    ? 'text-white font-medium bg-sky-500/10 border-r-2 border-sky-400'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                  }
                `}
              >
                {label}
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-sky-400" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Auth section at bottom */}
        <div className="border-t border-zinc-800/80 shrink-0">
          {loading ? (
            <div className="px-6 py-4">
              <div className="h-10 rounded-lg bg-zinc-800 animate-pulse" />
            </div>
          ) : user ? (
            <div className="px-5 py-4 space-y-1">
              {/* User info */}
              <div className="flex items-center gap-3 px-1 py-2 mb-1">
                <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-bold text-white shrink-0 border border-zinc-600">
                  {(user.email ?? 'U').slice(0, 1).toUpperCase()}
                </div>
                <p className="text-sm text-zinc-300 truncate">{user.email}</p>
              </div>
              {/* Library shortcut */}
              <Link
                href="/library"
                onClick={close}
                className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <BookMarked className="w-4 h-4 text-sky-400 shrink-0" />
                My Library
              </Link>
              {/* Sign out */}
              <button
                onClick={() => { close(); signOut() }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                Sign out
              </button>
            </div>
          ) : (
            <div className="px-5 py-4">
              <button
                onClick={() => { close(); openAuth('login') }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-white hover:bg-zinc-100 text-zinc-950 text-sm font-semibold transition-colors"
              >
                <User className="w-4 h-4" />
                Sign in
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
