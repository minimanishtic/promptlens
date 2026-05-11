import crypto from 'crypto'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export interface ApiKeyRecord {
  id: string
  user_id: string
  key_hash: string
  key_prefix: string
  name: string
  tier: string
  daily_search_limit: number
  daily_reverse_limit: number
  daily_format_limit: number
  is_active: boolean
  last_used_at: string | null
  expires_at: string | null
  created_at: string
}

let cachedAdmin: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (cachedAdmin) return cachedAdmin
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error(
      'Supabase admin client is not configured: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.',
    )
  }
  cachedAdmin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return cachedAdmin
}

// Generate a new API key — returns the raw key (shown once), its sha256 hash, and a display prefix.
export function generateApiKey(): { rawKey: string; hash: string; prefix: string } {
  const rawKey = `pk_${crypto.randomBytes(32).toString('hex')}`
  const hash = crypto.createHash('sha256').update(rawKey).digest('hex')
  // prefix = "pk_" + first 8 hex chars (total length 11)
  const prefix = rawKey.slice(0, 11)
  return { rawKey, hash, prefix }
}

export function hashApiKey(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey).digest('hex')
}

// Verify a raw API key. Returns the active record or null on miss/expired/inactive.
// On a hit, fires a non-blocking last_used_at update.
export async function verifyApiKey(rawKey: string): Promise<ApiKeyRecord | null> {
  const hash = hashApiKey(rawKey)
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('key_hash', hash)
    .eq('is_active', true)
    .maybeSingle()

  if (error || !data) return null

  const record = data as ApiKeyRecord
  if (record.expires_at && new Date(record.expires_at).getTime() < Date.now()) return null

  // Fire-and-forget — don't block the request on a write.
  void supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', record.id)
    .then(() => undefined)

  return record
}

export async function createApiKeyForUser(
  userId: string,
  name: string = 'Default',
): Promise<{ key: string; record: ApiKeyRecord }> {
  const { rawKey, hash, prefix } = generateApiKey()
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      user_id: userId,
      key_hash: hash,
      key_prefix: prefix,
      name: name?.trim() || 'Default',
      tier: 'free',
      daily_search_limit: 20,
      daily_reverse_limit: 5,
      daily_format_limit: 20,
    })
    .select()
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to create API key')
  }
  return { key: rawKey, record: data as ApiKeyRecord }
}

export async function logApiUsage(
  apiKeyId: string,
  endpoint: string,
  statusCode: number,
  latencyMs: number,
): Promise<void> {
  try {
    await getSupabaseAdmin().from('api_usage').insert({
      api_key_id: apiKeyId,
      endpoint,
      status_code: statusCode,
      latency_ms: latencyMs,
    })
  } catch {
    // Never throw out of usage logging — request has already been served.
  }
}

// Daily count for a key + an endpoint LIKE pattern (e.g. "/api/v1/search").
export async function getDailyUsage(apiKeyId: string, endpointPattern: string): Promise<number> {
  const startOfDay = new Date()
  startOfDay.setUTCHours(0, 0, 0, 0)

  const { count, error } = await getSupabaseAdmin()
    .from('api_usage')
    .select('*', { count: 'exact', head: true })
    .eq('api_key_id', apiKeyId)
    .like('endpoint', endpointPattern)
    .gte('created_at', startOfDay.toISOString())

  if (error) return 0
  return count ?? 0
}

// Revoke a key. User must own it (we scope the update by user_id).
export async function revokeApiKey(keyId: string, userId: string): Promise<boolean> {
  const { error } = await getSupabaseAdmin()
    .from('api_keys')
    .update({ is_active: false })
    .eq('id', keyId)
    .eq('user_id', userId)
  return !error
}
