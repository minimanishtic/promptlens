import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getSupabaseAdmin } from '@/lib/api-keys'
import { planFromRazorpayPlanId, FREE_TIER } from '@/lib/razorpay'

// Razorpay sends signed events. We must read the raw body (not parsed JSON)
// to compute the HMAC; that's why this uses req.text() before JSON.parse.
export async function POST(req: NextRequest): Promise<NextResponse> {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[webhook] RAZORPAY_WEBHOOK_SECRET not set')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })
  }

  const signature = req.headers.get('x-razorpay-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const body = await req.text()

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex')

  let signatureValid = false
  try {
    signatureValid =
      signature.length === expectedSignature.length &&
      crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  } catch {
    signatureValid = false
  }
  if (!signatureValid) {
    console.error('[webhook] Invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let event: any
  try {
    event = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const eventType: string = event?.event ?? ''
  const subEntity = event?.payload?.subscription?.entity
  const paymentEntity = event?.payload?.payment?.entity

  const admin = getSupabaseAdmin()

  try {
    switch (eventType) {
      case 'subscription.activated':
      case 'subscription.charged': {
        const subscriptionId: string | undefined = subEntity?.id
        const planId: string | undefined = subEntity?.plan_id
        if (!subscriptionId) break

        const plan = planFromRazorpayPlanId(planId)
        if (!plan) {
          console.warn(`[webhook] ${eventType}: plan_id ${planId} not recognized`)
          break
        }

        // Find the owning user via the subscription_id, then propagate tier
        // and limits across ALL of that user's active keys.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: subRow, error: lookupErr } = await (admin as any)
          .from('api_keys')
          .select('user_id')
          .eq('razorpay_subscription_id', subscriptionId)
          .maybeSingle()
        if (lookupErr || !subRow?.user_id) {
          console.error(`[webhook] ${eventType}: cannot resolve user for subscription ${subscriptionId}`, lookupErr)
          break
        }
        const userId = subRow.user_id as string

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updErr } = await (admin as any)
          .from('api_keys')
          .update({
            tier: plan.tier,
            subscription_status: 'active',
            daily_search_limit: plan.daily_search_limit,
            daily_reverse_limit: plan.daily_reverse_limit,
            daily_format_limit: plan.daily_format_limit,
          })
          .eq('user_id', userId)
          .eq('is_active', true)
        if (updErr) {
          console.error(`[webhook] ${eventType}: update failed`, updErr)
        }
        break
      }

      case 'subscription.cancelled':
      case 'subscription.halted': {
        const subscriptionId: string | undefined = subEntity?.id
        if (!subscriptionId) break

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: subRow, error: lookupErr } = await (admin as any)
          .from('api_keys')
          .select('user_id')
          .eq('razorpay_subscription_id', subscriptionId)
          .maybeSingle()
        if (lookupErr || !subRow?.user_id) {
          console.error(`[webhook] ${eventType}: cannot resolve user`, lookupErr)
          break
        }
        const userId = subRow.user_id as string

        const newStatus = eventType === 'subscription.cancelled' ? 'cancelled' : 'past_due'

        // Downgrade all of this user's active keys to free.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updErr } = await (admin as any)
          .from('api_keys')
          .update({
            tier: FREE_TIER.tier,
            subscription_status: newStatus,
            daily_search_limit: FREE_TIER.daily_search_limit,
            daily_reverse_limit: FREE_TIER.daily_reverse_limit,
            daily_format_limit: FREE_TIER.daily_format_limit,
          })
          .eq('user_id', userId)
          .eq('is_active', true)
        if (updErr) {
          console.error(`[webhook] ${eventType}: downgrade failed`, updErr)
        }
        break
      }

      case 'payment.failed': {
        const subscriptionId: string | undefined = paymentEntity?.subscription_id
        if (!subscriptionId) break

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updErr } = await (admin as any)
          .from('api_keys')
          .update({ subscription_status: 'past_due' })
          .eq('razorpay_subscription_id', subscriptionId)
        if (updErr) {
          console.error('[webhook] payment.failed: status update failed', updErr)
        }
        break
      }

      default:
        // Ignore unknown events — log for observability.
        console.log(`[webhook] ignoring event: ${eventType}`)
    }
  } catch (err) {
    console.error('[webhook] processing error:', err)
    // Still return 200 for unrecognized exceptions? No — return 500 so Razorpay retries.
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }

  return NextResponse.json({ status: 'ok' })
}
