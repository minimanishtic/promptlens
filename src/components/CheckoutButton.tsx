'use client'

import { useCallback, useState } from 'react'
import { useAuth } from '@/context/AuthContext'

interface CheckoutButtonProps {
  plan: 'pro' | 'team'
  label: string
  className?: string
}

interface CheckoutResponse {
  subscription_id: string
  razorpay_key: string
  plan_name: string
  amount: number
  currency: string
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay?: new (options: Record<string, any>) => { open: () => void }
  }
}

export default function CheckoutButton({ plan, label, className }: CheckoutButtonProps) {
  const { user, openAuth } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onClick = useCallback(async () => {
    if (!user) {
      openAuth('login')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = (await res.json()) as CheckoutResponse | { error: string }
      if (!res.ok || 'error' in data) {
        setError('error' in data ? data.error : 'Failed to start checkout')
        return
      }
      if (typeof window === 'undefined' || !window.Razorpay) {
        setError('Razorpay script failed to load. Please refresh and try again.')
        return
      }
      const rzp = new window.Razorpay({
        key: data.razorpay_key,
        subscription_id: data.subscription_id,
        name: 'Promere',
        description: data.plan_name,
        prefill: { email: user.email ?? '' },
        theme: { color: '#dc2626' },
        handler: () => {
          window.location.reload()
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      })
      rzp.open()
    } catch (err) {
      console.error('[CheckoutButton]', err)
      setError('Something went wrong. Please try again.')
    } finally {
      // If checkout opened, loading flips off when modal dismisses or page reloads.
      // If it didn't, the catch / early returns above already handled it.
      setLoading(false)
    }
  }, [plan, user, openAuth])

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className={className}
      >
        {loading ? 'Processing…' : label}
      </button>
      {error && (
        <p className="mt-2 text-xs text-rose-400">{error}</p>
      )}
    </div>
  )
}
