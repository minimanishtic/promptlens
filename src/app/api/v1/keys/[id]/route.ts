import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { revokeApiKey } from '@/lib/api-keys'
import { corsPreflight, withCors, apiError } from '@/lib/api-middleware'

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('unauthorized', 'Sign in required', 401)

  const segments = req.nextUrl.pathname.split('/').filter(Boolean)
  const id = segments[segments.length - 1]
  if (!id) return apiError('bad_request', 'Key id is required', 400)

  const ok = await revokeApiKey(id, user.id)
  if (!ok) return apiError('internal_error', 'Failed to revoke key', 500)

  return withCors(NextResponse.json({ revoked: true }))
}

export function OPTIONS(): NextResponse {
  return corsPreflight()
}
