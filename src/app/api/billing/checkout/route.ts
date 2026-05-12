import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createApiKeyForUser, getSupabaseAdmin } from '@/lib/api-keys'
import { getRazorpay, PLANS, type PlanId } from '@/lib/razorpay'

interface KeyRowForBilling {
  id: string
  user_id: string
  razorpay_customer_id: string | null
  razorpay_subscription_id: string | null
  subscription_status: string | null
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. Auth — session cookie, not Bearer key.
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Body validation.
  let body: { plan?: unknown }
  try {
    body = (await req.json()) as { plan?: unknown }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const plan = body.plan
  if (typeof plan !== 'string' || !(plan in PLANS)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }
  const selectedPlan = PLANS[plan as PlanId]
  if (!selectedPlan.id) {
    return NextResponse.json(
      { error: `Plan "${plan}" is not configured (RAZORPAY_${plan.toUpperCase()}_PLAN_ID is missing).` },
      { status: 500 },
    )
  }

  const admin = getSupabaseAdmin()

  // 3. Pick the user's "billing key": most recently created active key.
  //    Create one on the fly if none exists. This gives us a stable row to
  //    attach razorpay_customer_id / razorpay_subscription_id to.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: keysData, error: keysErr } = await (admin as any)
    .from('api_keys')
    .select('id, user_id, razorpay_customer_id, razorpay_subscription_id, subscription_status')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)

  if (keysErr) {
    console.error('[/api/billing/checkout] key fetch error:', keysErr)
    return NextResponse.json({ error: 'Failed to load account' }, { status: 500 })
  }

  let billingKey: KeyRowForBilling | null =
    Array.isArray(keysData) && keysData.length > 0 ? (keysData[0] as KeyRowForBilling) : null

  if (!billingKey) {
    try {
      const { record } = await createApiKeyForUser(user.id, 'Default')
      billingKey = {
        id: record.id,
        user_id: record.user_id,
        razorpay_customer_id: null,
        razorpay_subscription_id: null,
        subscription_status: null,
      }
    } catch (err) {
      console.error('[/api/billing/checkout] auto-create key failed:', err)
      return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
    }
  }

  // 4. Refuse double-subscribing.
  if (billingKey.subscription_status === 'active' && billingKey.razorpay_subscription_id) {
    return NextResponse.json(
      { error: 'You already have an active subscription. Cancel it first to change plans.' },
      { status: 409 },
    )
  }

  const razorpay = getRazorpay()

  // 5. Get or create the Razorpay customer. Persist immediately so a failure
  //    further down doesn't orphan it.
  let customerId = billingKey.razorpay_customer_id
  if (!customerId) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fullName = (user.user_metadata as any)?.full_name as string | undefined
      const customer = await razorpay.customers.create({
        name: fullName || user.email || 'Promere User',
        email: user.email,
        notes: { user_id: user.id },
      })
      customerId = customer.id
    } catch (err) {
      console.error('[/api/billing/checkout] customer create failed:', err)
      return NextResponse.json({ error: 'Failed to create customer' }, { status: 502 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: persistErr } = await (admin as any)
      .from('api_keys')
      .update({ razorpay_customer_id: customerId })
      .eq('id', billingKey.id)
    if (persistErr) {
      console.error('[/api/billing/checkout] persist customer failed:', persistErr)
      return NextResponse.json({ error: 'Failed to save customer' }, { status: 500 })
    }
  }

  // 6. Create the subscription. Razorpay's TS types don't include customer_id
  //    on subscriptions.create — but the REST API does. Cast through unknown.
  let subscriptionId: string
  try {
    const subParams = {
      plan_id: selectedPlan.id,
      customer_id: customerId,
      quantity: 1,
      total_count: 12,
      notes: { user_id: user.id, plan: selectedPlan.tier },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as unknown as any
    const subscription = await razorpay.subscriptions.create(subParams)
    subscriptionId = subscription.id
  } catch (err) {
    console.error('[/api/billing/checkout] subscription create failed:', err)
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 502 })
  }

  // 7. Persist the subscription id + pending status.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: subPersistErr } = await (admin as any)
    .from('api_keys')
    .update({
      razorpay_subscription_id: subscriptionId,
      subscription_status: 'pending',
    })
    .eq('id', billingKey.id)
  if (subPersistErr) {
    console.error('[/api/billing/checkout] persist subscription failed:', subPersistErr)
    return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 })
  }

  return NextResponse.json({
    subscription_id: subscriptionId,
    razorpay_key: process.env.RAZORPAY_KEY_ID,
    plan_name: selectedPlan.name,
    amount: selectedPlan.price,
    currency: selectedPlan.currency,
  })
}
