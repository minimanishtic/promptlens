import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { KNOWN_PRIMARY_CATEGORIES } from '@/lib/primary-categories'

export const dynamic = 'force-dynamic'

const db = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

export type BrowseCategoryOption = { value: string; label: string; count: number }

/**
 * Returns all known primary categories with exact counts from the server.
 * Uses @supabase/supabase-js (not the browser client) so counts are never
 * truncated by default row limits on partial scans.
 */
export async function GET() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  try {
    const rows = await Promise.all(
      KNOWN_PRIMARY_CATEGORIES.map(async (name) => {
        const { count, error } = await db
          .from('generations')
          .select('id', { count: 'exact', head: true })
          .eq('primary_category', name)

        if (error) throw error
        return { value: name, label: name, count: count ?? 0 } satisfies BrowseCategoryOption
      }),
    )

    rows.sort((a, b) => b.count - a.count)
    return NextResponse.json({ categories: rows })
  } catch (e) {
    console.error('browse/categories:', e)
    return NextResponse.json({ error: 'Failed to load categories' }, { status: 500 })
  }
}
