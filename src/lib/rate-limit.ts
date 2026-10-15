// Lightweight in-memory rate limiter. Good enough to blunt brute-force within
// a warm serverless instance; for strict global limits use a shared store.
const hits = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = hits.get(key)
  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= max) return false
  entry.count += 1
  return true
}

// Opportunistically drop expired entries so the map does not grow unbounded.
export function sweep(): void {
  const now = Date.now()
  for (const [k, v] of hits) if (now > v.resetAt) hits.delete(k)
}
