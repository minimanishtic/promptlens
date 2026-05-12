'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Key, Plus, Trash2, Copy, Check, AlertTriangle, BarChart3, Zap } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { NavAuthButton } from '@/components/UserMenu'
import MobileNav from '@/components/MobileNav'
import CheckoutButton from '@/components/CheckoutButton'

interface KeyRecord {
  id: string
  name: string
  key_prefix: string
  tier: string
  is_active: boolean
  daily_search_limit: number
  daily_reverse_limit: number
  daily_format_limit: number
  created_at: string
  last_used_at: string | null
  expires_at: string | null
}

interface UsageData {
  today: Record<string, number>
  last_7_days: Array<{ date: string; counts: Record<string, number> }>
  last_30_days_total: Record<string, number>
  limits: { search: number; reverse: number; format: number }
}

export default function DashboardPage() {
  const { user, loading, openAuth } = useAuth()
  const [keys, setKeys] = useState<KeyRecord[] | null>(null)
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [keysError, setKeysError] = useState<string | null>(null)
  const [usageError, setUsageError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [revealedKey, setRevealedKey] = useState<{ key: string; id: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const loadKeys = useCallback(async () => {
    setKeysError(null)
    const res = await fetch('/api/v1/keys', { credentials: 'include' })
    if (!res.ok) {
      setKeysError('Failed to load API keys')
      return
    }
    const json = (await res.json()) as { keys: KeyRecord[] }
    setKeys(json.keys)
  }, [])

  const loadUsage = useCallback(async () => {
    setUsageError(null)
    const res = await fetch('/api/v1/usage', { credentials: 'include' })
    if (!res.ok) {
      setUsageError('Failed to load usage')
      return
    }
    const json = (await res.json()) as UsageData
    setUsage(json)
  }, [])

  useEffect(() => {
    if (!user) return
    void loadKeys()
    void loadUsage()
  }, [user, loadKeys, loadUsage])

  const onCreateKey = useCallback(async () => {
    setCreating(true)
    try {
      const res = await fetch('/api/v1/keys', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Default' }),
      })
      if (!res.ok) {
        const text = await res.text()
        alert(`Failed to create key: ${text}`)
        return
      }
      const json = (await res.json()) as { key: string; record: KeyRecord }
      setRevealedKey({ key: json.key, id: json.record.id })
      setCopied(false)
      await loadKeys()
    } finally {
      setCreating(false)
    }
  }, [loadKeys])

  const onRevoke = useCallback(
    async (id: string) => {
      if (!confirm('Revoke this key? Existing requests with this key will start failing immediately.')) return
      const res = await fetch(`/api/v1/keys/${id}`, { method: 'DELETE', credentials: 'include' })
      if (!res.ok) {
        alert('Failed to revoke key')
        return
      }
      await loadKeys()
    },
    [loadKeys],
  )

  const onCopy = useCallback(async () => {
    if (!revealedKey) return
    await navigator.clipboard.writeText(revealedKey.key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [revealedKey])

  const weeklyMax = useMemo(() => {
    if (!usage) return 1
    let max = 1
    for (const day of usage.last_7_days) {
      const sum = (day.counts['/api/v1/search'] ?? 0) + (day.counts['/api/v1/reverse'] ?? 0) + (day.counts['/api/v1/format'] ?? 0)
      if (sum > max) max = sum
    }
    return max
  }, [usage])

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <DashboardNav />

      <main className="max-w-screen-xl mx-auto px-4 py-10 sm:py-14">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/20 flex items-center justify-center">
            <Key className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Developer Dashboard</h1>
            <p className="text-sm text-zinc-400">Manage API keys and monitor usage.</p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-8 animate-pulse">
            <div className="h-5 w-40 bg-zinc-800 rounded mb-4" />
            <div className="h-3 w-full bg-zinc-800/70 rounded" />
          </div>
        ) : !user ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-8 text-center">
            <h2 className="text-lg font-semibold mb-2">Sign in to access the dashboard</h2>
            <p className="text-sm text-zinc-400 mb-5">Create API keys, track usage, and manage your account.</p>
            <button
              onClick={() => openAuth('login')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-zinc-950 font-semibold hover:bg-zinc-100 transition-colors"
            >
              Sign in
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            <KeysSection
              keys={keys}
              error={keysError}
              creating={creating}
              onCreate={onCreateKey}
              onRevoke={onRevoke}
            />

            <UsageSection usage={usage} error={usageError} weeklyMax={weeklyMax} />

            <TierSection keys={keys} />

            <QuickStartSection prefix={keys?.find((k) => k.is_active)?.key_prefix ?? 'pk_xxxxxxxx'} />
          </div>
        )}
      </main>

      {revealedKey && (
        <KeyRevealModal
          rawKey={revealedKey.key}
          onCopy={onCopy}
          copied={copied}
          onClose={() => setRevealedKey(null)}
        />
      )}
    </div>
  )
}

function DashboardNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
      <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center gap-4">
        <Link href="/" className="text-lg font-bold text-white shrink-0">
          Pro<span className="text-sky-400">mere</span>
        </Link>
        <span className="text-zinc-700 hidden sm:block">|</span>
        <nav className="hidden sm:flex items-center gap-4 text-sm text-zinc-400 flex-1">
          <Link href="/browse"    className="hover:text-white transition-colors">Browse</Link>
          <Link href="/glossary"  className="hover:text-white transition-colors">Glossary</Link>
          <Link href="/analytics" className="hover:text-white transition-colors">Analytics</Link>
          <Link href="/templates" className="hover:text-white transition-colors">Templates</Link>
          <Link href="/pricing"   className="hover:text-white transition-colors">Pricing</Link>
          <Link href="/docs/api"  className="hover:text-white transition-colors">API Docs</Link>
          <Link href="/dashboard" className="text-white font-medium">Dashboard</Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <NavAuthButton />
          <MobileNav />
        </div>
      </div>
    </header>
  )
}

function KeysSection({
  keys,
  error,
  creating,
  onCreate,
  onRevoke,
}: {
  keys: KeyRecord[] | null
  error: string | null
  creating: boolean
  onCreate: () => void
  onRevoke: (id: string) => void
}) {
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
        <div>
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Key className="w-4 h-4 text-sky-400" />
            API Keys
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">Keys are shown once at creation — save them somewhere safe.</p>
        </div>
        <button
          onClick={onCreate}
          disabled={creating}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-zinc-950 text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          {creating ? 'Generating…' : 'Generate API Key'}
        </button>
      </div>

      {error && (
        <div className="px-5 py-3 text-sm text-rose-400 border-b border-zinc-800">{error}</div>
      )}

      {!keys ? (
        <div className="px-5 py-6 text-sm text-zinc-500">Loading…</div>
      ) : keys.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-zinc-500">
          No keys yet. Click <span className="text-zinc-300 font-medium">Generate API Key</span> to create your first.
        </div>
      ) : (
        <div className="divide-y divide-zinc-800">
          {keys.map((k) => (
            <div key={k.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <code className="text-sm font-mono text-zinc-200">{k.key_prefix}…</code>
                  <span className="text-xs text-zinc-500">{k.name}</span>
                  <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 text-sky-300">
                    {k.tier}
                  </span>
                  {!k.is_active && (
                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300">
                      revoked
                    </span>
                  )}
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  Created {formatDate(k.created_at)} · Last used {k.last_used_at ? formatDate(k.last_used_at) : '—'}
                </div>
              </div>
              {k.is_active && (
                <button
                  onClick={() => onRevoke(k.id)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-zinc-700 text-xs text-zinc-300 hover:bg-rose-500/10 hover:border-rose-500/40 hover:text-rose-300 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function UsageSection({
  usage,
  error,
  weeklyMax,
}: {
  usage: UsageData | null
  error: string | null
  weeklyMax: number
}) {
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-800">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-sky-400" />
          Usage
        </h2>
        <p className="text-xs text-zinc-500 mt-0.5">UTC-day windows. Limits sum across your active keys.</p>
      </div>

      {error && <div className="px-5 py-3 text-sm text-rose-400 border-b border-zinc-800">{error}</div>}

      {!usage ? (
        <div className="px-5 py-6 text-sm text-zinc-500">Loading…</div>
      ) : (
        <div className="px-5 py-5 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <UsageBar
              label="Search"
              used={usage.today['/api/v1/search'] ?? 0}
              limit={usage.limits.search}
            />
            <UsageBar
              label="Reverse"
              used={usage.today['/api/v1/reverse'] ?? 0}
              limit={usage.limits.reverse}
            />
            <UsageBar
              label="Format"
              used={usage.today['/api/v1/format'] ?? 0}
              limit={usage.limits.format}
            />
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">Last 7 days</h3>
            <div className="flex items-end gap-2 h-32">
              {usage.last_7_days.map((day) => {
                const search = day.counts['/api/v1/search'] ?? 0
                const reverse = day.counts['/api/v1/reverse'] ?? 0
                const format = day.counts['/api/v1/format'] ?? 0
                const total = search + reverse + format
                const pct = Math.max(0, Math.min(100, (total / weeklyMax) * 100))
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5">
                    <div className="w-full bg-zinc-800/40 rounded-t-sm flex flex-col-reverse h-24" title={`${total} requests`}>
                      <div
                        className="w-full rounded-t-sm bg-sky-400/80"
                        style={{ height: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-zinc-500">{day.date.slice(5)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0
  const danger = pct >= 100
  const warn = pct >= 80
  const color = danger ? 'bg-rose-500' : warn ? 'bg-amber-400' : 'bg-sky-400'
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-sm font-medium text-zinc-200">{label}</span>
        <span className="text-xs text-zinc-500 tabular-nums">
          {used} / {limit > 0 ? limit : '—'}
        </span>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function TierSection({ keys }: { keys: KeyRecord[] | null }) {
  const active = keys?.find((k) => k.is_active)
  const tier = (active?.tier ?? 'free') as 'free' | 'pro' | 'team' | string
  const badgeClass =
    tier === 'team'
      ? 'bg-violet-500/15 border-violet-500/30 text-violet-300'
      : tier === 'pro'
        ? 'bg-sky-500/15 border-sky-500/30 text-sky-300'
        : 'bg-zinc-500/15 border-zinc-500/30 text-zinc-300'
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-800">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <Zap className="w-4 h-4 text-sky-400" />
          Tier
        </h2>
      </div>
      <div className="px-5 py-5 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div>
            <div className="text-sm text-zinc-300 flex items-center gap-2">
              Current tier:
              <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeClass}`}>
                {tier}
              </span>
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              {active
                ? `Daily limits: ${active.daily_search_limit} search · ${active.daily_reverse_limit} reverse · ${active.daily_format_limit} format`
                : 'No active key — generate one to see your limits.'}
            </div>
          </div>
          <Link
            href="/pricing"
            className="text-xs text-sky-400 hover:underline"
          >
            Compare plans →
          </Link>
        </div>
        {tier === 'free' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CheckoutButton
              plan="pro"
              label="Upgrade to Pro — $9/mo"
              className="inline-flex w-full items-center justify-center px-4 py-2 rounded-lg bg-white text-zinc-950 text-sm font-semibold hover:bg-zinc-100 disabled:opacity-60 transition-colors"
            />
            <CheckoutButton
              plan="team"
              label="Upgrade to Team — $29/mo"
              className="inline-flex w-full items-center justify-center px-4 py-2 rounded-lg border border-zinc-700 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-60 transition-colors"
            />
          </div>
        )}
        {tier === 'pro' && (
          <CheckoutButton
            plan="team"
            label="Upgrade to Team — $29/mo"
            className="inline-flex w-full sm:w-auto self-start items-center justify-center px-4 py-2 rounded-lg bg-white text-zinc-950 text-sm font-semibold hover:bg-zinc-100 disabled:opacity-60 transition-colors"
          />
        )}
        {tier === 'team' && (
          <div className="text-xs text-zinc-400">
            You&apos;re on the highest tier. Need higher limits?{' '}
            <a href="mailto:hi@promere.app" className="text-sky-400 hover:underline">Contact us</a>.
          </div>
        )}
        {tier !== 'free' && (
          <div className="text-xs text-zinc-500">
            Manage subscription via your Razorpay receipt email — a self-serve portal is coming soon.
          </div>
        )}
      </div>
    </section>
  )
}

function QuickStartSection({ prefix }: { prefix: string }) {
  const snippet = `curl -X POST https://www.promere.app/api/v1/search \\
  -H "Authorization: Bearer ${prefix === 'pk_xxxxxxxx' ? 'pk_your_key_here' : `${prefix}…`}" \\
  -H "Content-Type: application/json" \\
  -d '{"query": "cinematic portrait in rain", "limit": 5}'`
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-800">
        <h2 className="text-base font-semibold">Quick Start</h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          See the full reference at <Link href="/docs/api" className="text-sky-400 hover:underline">/docs/api</Link>.
        </p>
      </div>
      <pre className="px-5 py-4 text-xs text-zinc-200 font-mono overflow-x-auto whitespace-pre">{snippet}</pre>
    </section>
  )
}

function KeyRevealModal({
  rawKey,
  onCopy,
  copied,
  onClose,
}: {
  rawKey: string
  onCopy: () => void
  copied: boolean
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
        <div className="px-5 py-4 border-b border-zinc-800">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Key className="w-4 h-4 text-sky-400" />
            Your new API key
          </h3>
        </div>
        <div className="px-5 py-5 space-y-4">
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              This key will <span className="font-semibold">not be shown again</span>. Copy it now and store it securely.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-200 overflow-x-auto whitespace-nowrap">
              {rawKey}
            </code>
            <button
              onClick={onCopy}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white text-zinc-950 text-xs font-semibold hover:bg-zinc-100 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
        <div className="px-5 py-3 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-md text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
