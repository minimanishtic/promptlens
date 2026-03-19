'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { LogOut, BookMarked, ChevronDown, User } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export default function UserMenu() {
  const { user, loading, signOut, openAuth } = useAuth()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (loading) {
    return <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse" />
  }

  if (!user) {
    return (
      <button
        onClick={() => openAuth('login')}
        className="text-sm px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors"
      >
        Sign in
      </button>
    )
  }

  const initials = (user.email ?? 'U').slice(0, 1).toUpperCase()

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 group"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-sm font-bold text-white group-hover:bg-violet-500 transition-colors">
          {initials}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl shadow-black/40 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* User info */}
          <div className="px-4 py-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {initials}
              </div>
              <p className="text-xs text-zinc-300 truncate">{user.email}</p>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <Link
              href="/library"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <BookMarked className="w-4 h-4 text-violet-400" />
              My Library
            </Link>
            <div className="border-t border-zinc-800 my-1" />
            <button
              onClick={() => { setOpen(false); signOut() }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// A simpler version used inline in non-root navs — just the sign-in button or avatar
export function NavAuthButton() {
  const { user, loading, openAuth } = useAuth()

  if (loading) return <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse" />

  if (!user) {
    return (
      <button
        onClick={() => openAuth('login')}
        className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition-colors"
      >
        <User className="w-4 h-4" />
        Sign in
      </button>
    )
  }

  return <UserMenu />
}
