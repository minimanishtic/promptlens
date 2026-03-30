const rateMap = new Map<string, { count: number; resetTime: number }>()

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, val] of rateMap) {
    if (now > val.resetTime) rateMap.delete(key)
  }
}, 5 * 60 * 1000)

export function rateLimit(
  key: string,
  limit: number = 30,
  windowMs: number = 60_000,
): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const entry = rateMap.get(key)

  if (!entry || now > entry.resetTime) {
    rateMap.set(key, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: limit - 1 }
  }

  entry.count++
  if (entry.count > limit) {
    return { allowed: false, remaining: 0 }
  }
  return { allowed: true, remaining: limit - entry.count }
}
