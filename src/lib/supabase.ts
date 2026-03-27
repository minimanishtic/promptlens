import { createClient } from './supabase-client'
import type { Database } from '@/types/database'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Browser auth + data client. Always goes through `supabase-client` singleton
 * (same instance as AuthProvider / Library / Save) — do not create a second client.
 */
export const supabase: SupabaseClient<Database> = createClient()
