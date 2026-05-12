import { NextRequest, NextResponse } from 'next/server'
import {
  verifyApiKey,
  logApiUsage,
  getDailyUsage,
  type ApiKeyRecord,
} from './api-keys'

export interface ApiContext {
  apiKey: ApiKeyRecord
}

export type ApiHandler = (req: NextRequest, ctx: ApiContext) => Promise<NextResponse>

type LimitField =
  | 'daily_search_limit'
  | 'daily_reverse_limit'
  | 'daily_format_limit'

const ENDPOINT_LIMITS: Record<string, { field: LimitField; pattern: string }> = {
  '/api/v1/search':  { field: 'daily_search_limit',  pattern: '/api/v1/search' },
  '/api/v1/reverse': { field: 'daily_reverse_limit', pattern: '/api/v1/reverse' },
  '/api/v1/format':  { field: 'daily_format_limit',  pattern: '/api/v1/format' },
  // Parse uses the same field as format but is counted in its own pool so it
  // doesn't deplete /format's daily allowance.
  '/api/v1/parse':   { field: 'daily_format_limit',  pattern: '/api/v1/parse' },
}

export const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Max-Age': '86400',
}

export function withCors(res: NextResponse): NextResponse {
  for (const [k, v] of Object.entries(CORS_HEADERS)) res.headers.set(k, v)
  return res
}

// Standard CORS preflight handler — export from each route's file as `OPTIONS`.
export function corsPreflight(): NextResponse {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export function apiError(
  code: string,
  message: string,
  status: number,
  extra?: Record<string, unknown>,
): NextResponse {
  return withCors(
    NextResponse.json({ error: { code, message, ...extra } }, { status }),
  )
}

function nextMidnightUtc(): Date {
  const d = new Date()
  d.setUTCHours(24, 0, 0, 0)
  return d
}

export function withApiAuth(endpoint: string, handler: ApiHandler) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const start = Date.now()

    // 1. Extract API key
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return apiError(
        'unauthorized',
        'Missing or invalid Authorization header. Use: Bearer pk_xxx',
        401,
      )
    }
    const rawKey = authHeader.slice(7).trim()
    if (!rawKey.startsWith('pk_')) {
      return apiError('unauthorized', 'Invalid API key format. Keys start with pk_', 401)
    }

    // 2. Verify
    let keyRecord: ApiKeyRecord | null
    try {
      keyRecord = await verifyApiKey(rawKey)
    } catch (err) {
      console.error(`[${endpoint}] verifyApiKey threw:`, err)
      return apiError('internal_error', 'Auth service unavailable', 500)
    }
    if (!keyRecord) {
      return apiError('unauthorized', 'Invalid or expired API key', 401)
    }

    // 3. Rate limit (per-endpoint daily)
    const limitConfig = ENDPOINT_LIMITS[endpoint]
    let limit = 0
    let usedBefore = 0
    if (limitConfig) {
      usedBefore = await getDailyUsage(keyRecord.id, limitConfig.pattern)
      limit = keyRecord[limitConfig.field]
      if (usedBefore >= limit) {
        return apiError(
          'rate_limit_exceeded',
          `Daily ${endpoint.split('/').pop()} limit exceeded. Used ${usedBefore}/${limit}. Resets at midnight UTC.`,
          429,
          {
            limit,
            remaining: 0,
            reset_at: nextMidnightUtc().toISOString(),
          },
        )
      }
    }

    // 4. Call the handler
    const ctx: ApiContext = { apiKey: keyRecord }
    let response: NextResponse
    try {
      response = await handler(req, ctx)
    } catch (err) {
      const latency = Date.now() - start
      void logApiUsage(keyRecord.id, endpoint, 500, latency)
      console.error(`[${endpoint}] handler error:`, err)
      return apiError('internal_error', 'An unexpected error occurred', 500)
    }

    // 5. Add CORS + rate-limit headers
    withCors(response)
    if (limitConfig) {
      const remaining = Math.max(0, limit - usedBefore - 1)
      response.headers.set('X-RateLimit-Limit', String(limit))
      response.headers.set('X-RateLimit-Remaining', String(remaining))
      response.headers.set('X-RateLimit-Reset', nextMidnightUtc().toISOString())
    }

    // 6. Log usage (fire-and-forget)
    const latency = Date.now() - start
    void logApiUsage(keyRecord.id, endpoint, response.status, latency)

    return response
  }
}
