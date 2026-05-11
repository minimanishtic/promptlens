import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createApiKeyForUser, getSupabaseAdmin } from '@/lib/api-keys'
import { corsPreflight, withCors, apiError } from '@/lib/api-middleware'

// These routes are dashboard-only — auth is via Supabase session cookie, NOT Bearer key.

export async function GET(): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('unauthorized', 'Sign in required', 401)

  // Use service role so we can return key_prefix etc. without bumping into RLS edge cases.
  const admin = getSupabaseAdmin()
  const { data, error } = await admin
    .from('api_keys')
    .select(
      'id, name, key_prefix, tier, is_active, daily_search_limit, daily_reverse_limit, daily_format_limit, created_at, last_used_at, expires_at',
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[/api/v1/keys GET] DB error:', error)
    return apiError('internal_error', 'Failed to list keys', 500)
  }

  return withCors(NextResponse.json({ keys: data ?? [] }))
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('unauthorized', 'Sign in required', 401)

  let name = 'Default'
  try {
    const body = (await req.json()) as { name?: unknown }
    if (typeof body.name === 'string' && body.name.trim()) name = body.name.trim().slice(0, 60)
  } catch {
    // empty body is fine — use default name
  }

  try {
    const { key, record } = await createApiKeyForUser(user.id, name)
    return withCors(
      NextResponse.json({
        key, // shown ONCE
        record: {
          id: record.id,
          name: record.name,
          key_prefix: record.key_prefix,
          tier: record.tier,
          daily_search_limit: record.daily_search_limit,
          daily_reverse_limit: record.daily_reverse_limit,
          daily_format_limit: record.daily_format_limit,
          is_active: record.is_active,
          created_at: record.created_at,
          last_used_at: record.last_used_at,
          expires_at: record.expires_at,
        },
      }),
    )
  } catch (err) {
    console.error('[/api/v1/keys POST] create error:', err)
    return apiError('internal_error', 'Failed to create API key', 500)
  }
}

export function OPTIONS(): NextResponse {
  return corsPreflight()
}
