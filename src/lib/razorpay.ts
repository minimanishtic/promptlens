import Razorpay from 'razorpay'

let instance: Razorpay | null = null

export function getRazorpay(): Razorpay {
  if (instance) return instance
  const key_id = process.env.RAZORPAY_KEY_ID
  const key_secret = process.env.RAZORPAY_KEY_SECRET
  if (!key_id || !key_secret) {
    throw new Error('Razorpay is not configured: set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.')
  }
  instance = new Razorpay({ key_id, key_secret })
  return instance
}

export type PlanId = 'pro' | 'team'

export interface PlanDef {
  id: string
  tier: PlanId
  name: string
  price: number      // display price (whole units, USD)
  amount: number     // smallest currency unit (cents for USD)
  currency: 'USD' | 'INR'
  daily_search_limit: number
  daily_reverse_limit: number
  daily_format_limit: number
}

// IDs come from env so we can swap test/live without code changes.
// Plans must be created on the Razorpay side (via dashboard or API) before checkout works.
export const PLANS: Record<PlanId, PlanDef> = {
  pro: {
    id: process.env.RAZORPAY_PRO_PLAN_ID ?? '',
    tier: 'pro',
    name: 'Promere Pro',
    price: 9,
    amount: 900,
    currency: 'USD',
    daily_search_limit: 200,
    daily_reverse_limit: 50,
    daily_format_limit: 200,
  },
  team: {
    id: process.env.RAZORPAY_TEAM_PLAN_ID ?? '',
    tier: 'team',
    name: 'Promere Team',
    price: 29,
    amount: 2900,
    currency: 'USD',
    daily_search_limit: 1000,
    daily_reverse_limit: 200,
    daily_format_limit: 1000,
  },
}

// Free tier limits — referenced by webhook on downgrade.
export const FREE_TIER = {
  tier: 'free' as const,
  daily_search_limit: 20,
  daily_reverse_limit: 5,
  daily_format_limit: 20,
}

// Map a Razorpay plan_id back to our tier definition. Used by webhook.
export function planFromRazorpayPlanId(planId: string | undefined | null): PlanDef | null {
  if (!planId) return null
  for (const p of Object.values(PLANS)) {
    if (p.id && p.id === planId) return p
  }
  return null
}
