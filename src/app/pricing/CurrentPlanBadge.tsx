'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'

interface KeyRow {
  tier: string
  is_active: boolean
}

// Shows a "Current plan" pill on the tier card matching the signed-in user's tier.
// Renders nothing for guests or non-matching tiers.
export default function CurrentPlanBadge({ tier }: { tier: 'free' | 'pro' | 'team' }) {
  const { user, loading } = useAuth()
  const [currentTier, setCurrentTier] = useState<string | null>(null)

  useEffect(() => {
    if (loading || !user) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/v1/keys', { credentials: 'include' })
        if (!res.ok) return
        const json = (await res.json()) as { keys: KeyRow[] }
        if (cancelled) return
        const active = json.keys?.find((k) => k.is_active)
        setCurrentTier(active?.tier ?? 'free')
      } catch {
        // ignore — badge is decorative
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user, loading])

  if (!user || !currentTier || currentTier !== tier) return null

  return (
    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300">
      Current plan
    </span>
  )
}
