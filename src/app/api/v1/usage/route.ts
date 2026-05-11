import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/api-keys'
import { corsPreflight, withCors, apiError } from '@/lib/api-middleware'

interface UsageRow {
  api_key_id: string
  endpoint: string
  created_at: string
}

const TRACKED = ['/api/v1/search', '/api/v1/reverse', '/api/v1/format'] as const
type Endpoint = (typeof TRACKED)[number]

function emptyBucket(): Record<Endpoint, number> {
  return { '/api/v1/search': 0, '/api/v1/reverse': 0, '/api/v1/format': 0 }
}

export async function GET(): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('unauthorized', 'Sign in required', 401)

  const admin = getSupabaseAdmin()

  // Fetch the user's keys to compute limits and to scope usage rows.
  const { data: keys, error: keysErr } = await admin
    .from('api_keys')
    .select('id, daily_search_limit, daily_reverse_limit, daily_format_limit')
    .eq('user_id', user.id)

  if (keysErr) {
    console.error('[/api/v1/usage] keys error:', keysErr)
    return apiError('internal_error', 'Failed to load usage', 500)
  }
  const keyList = keys ?? []
  if (keyList.length === 0) {
    return withCors(
      NextResponse.json({
        today: emptyBucket(),
        last_7_days: Array.from({ length: 7 }, (_, i) => ({
          date: dateNDaysAgo(6 - i),
          counts: emptyBucket(),
        })),
        last_30_days_total: emptyBucket(),
        limits: { search: 0, reverse: 0, format: 0 },
      }),
    )
  }
  const keyIds = keyList.map((k) => k.id as string)

  // Sum daily limits across the user's active keys for the dashboard display.
  const limits = keyList.reduce(
    (acc, k) => ({
      search: acc.search + (k.daily_search_limit as number),
      reverse: acc.reverse + (k.daily_reverse_limit as number),
      format: acc.format + (k.daily_format_limit as number),
    }),
    { search: 0, reverse: 0, format: 0 },
  )

  // Pull last 30 days of rows once, then bucket in memory.
  const since = new Date()
  since.setUTCDate(since.getUTCDate() - 30)
  since.setUTCHours(0, 0, 0, 0)

  const { data: rows, error: usageErr } = await admin
    .from('api_usage')
    .select('api_key_id, endpoint, created_at')
    .in('api_key_id', keyIds)
    .in('endpoint', TRACKED as unknown as string[])
    .gte('created_at', since.toISOString())

  if (usageErr) {
    console.error('[/api/v1/usage] usage error:', usageErr)
    return apiError('internal_error', 'Failed to load usage', 500)
  }
  const usageRows = (rows ?? []) as UsageRow[]

  const today = emptyBucket()
  const monthTotal = emptyBucket()
  const todayKey = ymd(new Date())

  // Initialize last 7 days, oldest first.
  const last7: Array<{ date: string; counts: Record<Endpoint, number> }> = Array.from(
    { length: 7 },
    (_, i) => ({ date: dateNDaysAgo(6 - i), counts: emptyBucket() }),
  )
  const last7Index = new Map(last7.map((d, i) => [d.date, i]))

  for (const row of usageRows) {
    const ep = row.endpoint as Endpoint
    if (!TRACKED.includes(ep)) continue
    monthTotal[ep]++
    const dayKey = ymd(new Date(row.created_at))
    if (dayKey === todayKey) today[ep]++
    const idx = last7Index.get(dayKey)
    if (idx !== undefined) last7[idx].counts[ep]++
  }

  return withCors(
    NextResponse.json({
      today,
      last_7_days: last7,
      last_30_days_total: monthTotal,
      limits,
    }),
  )
}

export function OPTIONS(): NextResponse {
  return corsPreflight()
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function dateNDaysAgo(n: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - n)
  return ymd(d)
}
