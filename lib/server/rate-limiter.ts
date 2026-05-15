/**
 * In-memory rate limiter for serverless environments.
 * Uses a sliding window counter algorithm.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
let cleanupInterval: ReturnType<typeof setInterval> | null = null

function ensureCleanup() {
  if (!cleanupInterval) {
    cleanupInterval = setInterval(() => {
      const now = Date.now()
      for (const [key, entry] of store.entries()) {
        if (entry.resetAt < now) store.delete(key)
      }
    }, 5 * 60 * 1000)
    cleanupInterval.unref?.()
  }
}

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  max: number
  /** Window duration in seconds */
  windowSeconds: number
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetAt: number
}

export function rateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  ensureCleanup()

  const now = Date.now()
  const windowMs = config.windowSeconds * 1000
  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { success: true, limit: config.max, remaining: config.max - 1, resetAt: now + windowMs }
  }

  entry.count++

  if (entry.count > config.max) {
    return { success: false, limit: config.max, remaining: 0, resetAt: entry.resetAt }
  }

  return { success: true, limit: config.max, remaining: config.max - entry.count, resetAt: entry.resetAt }
}

/** Preset rate limit configs for common use cases */
export const rateLimitPresets = {
  /** Auth endpoints: 5 attempts per 15 minutes */
  auth: { max: 5, windowSeconds: 15 * 60 } as RateLimitConfig,
  /** Registration: 3 per 10 minutes */
  register: { max: 3, windowSeconds: 10 * 60 } as RateLimitConfig,
  /** Password reset: 3 per hour */
  passwordReset: { max: 3, windowSeconds: 60 * 60 } as RateLimitConfig,
  /** General API: 60 per minute */
  api: { max: 60, windowSeconds: 60 } as RateLimitConfig,
  /** Chat: 20 per minute */
  chat: { max: 20, windowSeconds: 60 } as RateLimitConfig,
  /** Reviews: 5 per hour */
  review: { max: 5, windowSeconds: 60 * 60 } as RateLimitConfig,
  /** Coupon validation: 30 per minute */
  coupon: { max: 30, windowSeconds: 60 } as RateLimitConfig,
  /** Wishlist: 10 per minute */
  wishlist: { max: 10, windowSeconds: 60 } as RateLimitConfig,
}

/** Extract a rate limit key from the request (IP-based) */
export function getRateLimitKey(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? 'unknown'
  return `rl:${ip}`
}

/** Get a scoped rate limit key (e.g., per-email for password reset) */
export function getScopedRateLimitKey(req: Request, scope: string): string {
  const ip = getRateLimitKey(req).replace('rl:', '')
  return `rl:${scope}:${ip}`
}
