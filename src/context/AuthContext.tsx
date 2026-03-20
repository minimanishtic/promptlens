'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import type { Session, User, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

interface AuthContextValue {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  openAuth: (mode?: 'login' | 'signup') => void
  closeAuth: () => void
  authOpen: boolean
  authMode: 'login' | 'signup'
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: false,
  signOut: async () => {},
  openAuth: () => {},
  closeAuth: () => {},
  authOpen: false,
  authMode: 'login',
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  // Start false — render the logged-out UI immediately, update when session resolves
  const [loading, setLoading] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')

  // Lazy ref — the Supabase client module is only evaluated after first paint
  const clientRef = useRef<SupabaseClient<Database> | null>(null)
  const unsubRef = useRef<(() => void) | null>(null)

  function getClient(): SupabaseClient<Database> {
    if (!clientRef.current) {
      // Dynamic require keeps supabase-client out of the synchronous module graph
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createClient } = require('@/lib/supabase-client') as typeof import('@/lib/supabase-client')
      clientRef.current = createClient()
    }
    return clientRef.current
  }

  useEffect(() => {
    // setTimeout(0) yields to the browser's render thread so the first paint
    // completes before the Supabase JS evaluates and getSession() fires.
    const timer = setTimeout(() => {
      const supabase = getClient()

      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session)
        setUser(session?.user ?? null)
      })

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      })

      unsubRef.current = () => subscription.unsubscribe()
    }, 0)

    return () => {
      clearTimeout(timer)
      unsubRef.current?.()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const signOut = useCallback(async () => {
    const supabase = getClient()
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openAuth = useCallback((mode: 'login' | 'signup' = 'login') => {
    setAuthMode(mode)
    setAuthOpen(true)
  }, [])

  const closeAuth = useCallback(() => setAuthOpen(false), [])

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, openAuth, closeAuth, authOpen, authMode }}>
      {children}
    </AuthContext.Provider>
  )
}
