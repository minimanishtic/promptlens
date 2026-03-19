import { createClient as createBrowserSupabaseClient } from './supabase-client'

// Single browser client instance — reuses the SSR-aware singleton.
// This ensures only one GoTrueClient exists in the browser.
let _supabase: ReturnType<typeof createBrowserSupabaseClient> | null = null

export const supabase = (() => {
  if (typeof window !== 'undefined') {
    // Browser: use the SSR-aware singleton
    if (!_supabase) {
      _supabase = createBrowserSupabaseClient()
    }
    return _supabase
  }
  // Server: createBrowserClient is safe to call here too (no localStorage in Node)
  return createBrowserSupabaseClient()
})()
