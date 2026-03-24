import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { parseSearchGlobalFilterCounts } from '@/lib/search-global-filter-counts'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

/**
 * GET /api/search/filter-counts
 * Returns aggregate classification counts for the search sidebar (full table).
 */
export async function GET() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('get_filter_counts')

    if (error) {
      console.warn('[filter-counts] get_filter_counts RPC failed — apply migration 20260324120000_get_filter_counts.sql:', error.message)
      return NextResponse.json({ counts: parseSearchGlobalFilterCounts(null) })
    }

    return NextResponse.json({ counts: parseSearchGlobalFilterCounts(data) })
  } catch (e) {
    console.error('[filter-counts]', e)
    return NextResponse.json({ counts: parseSearchGlobalFilterCounts(null) })
  }
}
