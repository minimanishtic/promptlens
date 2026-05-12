import Link from 'next/link'
import { Check, Zap } from 'lucide-react'
import { NavAuthButton } from '@/components/UserMenu'
import MobileNav from '@/components/MobileNav'
import CheckoutButton from '@/components/CheckoutButton'
import CurrentPlanBadge from './CurrentPlanBadge'

export const metadata = {
  title: 'Pricing — Promere',
  description: 'API pricing for Promere — semantic search, reverse-engineer, and multi-model prompt formatting.',
}

interface Tier {
  id: 'free' | 'pro' | 'team'
  name: string
  priceLabel: string
  blurb: string
  features: string[]
  cta:
    | { kind: 'static'; label: string }
    | { kind: 'checkout'; plan: 'pro' | 'team'; label: string }
}

const TIERS: Tier[] = [
  {
    id: 'free',
    name: 'Free',
    priceLabel: '$0',
    blurb: 'Try the API, build a prototype.',
    features: [
      '20 search calls / day',
      '5 reverse-engineer / day',
      '20 format calls / day',
      'All 10 models supported',
      '1 API key',
    ],
    cta: { kind: 'static', label: 'Included on signup' },
  },
  {
    id: 'pro',
    name: 'Pro',
    priceLabel: '$9',
    blurb: 'For indie builders shipping real products.',
    features: [
      '200 search calls / day',
      '50 reverse-engineer / day',
      '200 format calls / day',
      'All 10 models supported',
      '1 API key',
    ],
    cta: { kind: 'checkout', plan: 'pro', label: 'Upgrade to Pro' },
  },
  {
    id: 'team',
    name: 'Team',
    priceLabel: '$29',
    blurb: 'For small teams and production workloads.',
    features: [
      '1,000 search calls / day',
      '200 reverse-engineer / day',
      '1,000 format calls / day',
      'All 10 models supported',
      '5 API keys',
    ],
    cta: { kind: 'checkout', plan: 'team', label: 'Upgrade to Team' },
  },
]

const PRIMARY_BTN = 'inline-flex w-full items-center justify-center px-4 py-2.5 rounded-lg bg-white text-zinc-950 text-sm font-semibold hover:bg-zinc-100 disabled:opacity-60 transition-colors'
const SECONDARY_BTN = 'inline-flex w-full items-center justify-center px-4 py-2.5 rounded-lg border border-zinc-700 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <PricingNav />

      <main className="max-w-screen-xl mx-auto px-4 py-12 sm:py-16">
        <header className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-xs font-semibold uppercase tracking-wider text-sky-300 mb-4">
            <Zap className="w-3.5 h-3.5" />
            Pricing
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Simple, transparent API pricing</h1>
          <p className="text-zinc-400 max-w-xl mx-auto">
            Start free. Upgrade when your usage grows. All tiers include access to every supported model.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TIERS.map((tier) => (
            <article
              key={tier.id}
              className={
                tier.id === 'pro'
                  ? 'relative rounded-2xl border border-sky-500/40 bg-gradient-to-b from-sky-500/5 to-transparent p-6 flex flex-col'
                  : 'relative rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 flex flex-col'
              }
            >
              {tier.id === 'pro' && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-500 text-zinc-950">
                  Most popular
                </span>
              )}

              <div className="flex items-baseline justify-between">
                <h2 className="text-xl font-semibold">{tier.name}</h2>
                <CurrentPlanBadge tier={tier.id} />
              </div>
              <p className="text-sm text-zinc-400 mt-1">{tier.blurb}</p>

              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-bold">{tier.priceLabel}</span>
                {tier.id !== 'free' && <span className="text-sm text-zinc-500">/ month</span>}
              </div>

              <ul className="mt-6 space-y-2.5 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-zinc-300">
                    <Check className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                {tier.cta.kind === 'checkout' ? (
                  <CheckoutButton
                    plan={tier.cta.plan}
                    label={tier.cta.label}
                    className={tier.id === 'pro' ? PRIMARY_BTN : SECONDARY_BTN}
                  />
                ) : (
                  <Link href="/dashboard" className={SECONDARY_BTN}>
                    {tier.cta.label}
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>

        <section className="mt-14">
          <h3 className="text-lg font-semibold mb-4">Feature comparison</h3>
          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-sm">
              <thead className="bg-zinc-900/60 text-xs uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Feature</th>
                  <th className="text-left px-4 py-3 font-semibold">Free</th>
                  <th className="text-left px-4 py-3 font-semibold">Pro ($9/mo)</th>
                  <th className="text-left px-4 py-3 font-semibold">Team ($29/mo)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {COMPARE_ROWS.map((row) => (
                  <tr key={row[0]}>
                    {row.map((cell, i) => (
                      <td key={i} className={i === 0 ? 'px-4 py-3 text-zinc-300' : 'px-4 py-3 text-zinc-200 tabular-nums'}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-12 rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 text-center">
          <h3 className="text-base font-semibold mb-1">Need higher limits or custom terms?</h3>
          <p className="text-sm text-zinc-400 mb-4">
            We&apos;ll work with you on volume pricing, dedicated support, and SLAs.
          </p>
          <a
            href="mailto:hi@promere.app"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-zinc-700 text-sm text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            Contact us
          </a>
        </section>
      </main>
    </div>
  )
}

const COMPARE_ROWS: string[][] = [
  ['Search calls / day', '20', '200', '1,000'],
  ['Reverse-engineer / day', '5', '50', '200'],
  ['Format calls / day', '20', '200', '1,000'],
  ['Models supported', 'All 10', 'All 10', 'All 10'],
  ['API keys', '1', '1', '5'],
]

function PricingNav() {
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
          <Link href="/pricing"   className="text-white font-medium">Pricing</Link>
          <Link href="/docs/api"  className="hover:text-white transition-colors">API Docs</Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <NavAuthButton />
          <MobileNav />
        </div>
      </div>
    </header>
  )
}
