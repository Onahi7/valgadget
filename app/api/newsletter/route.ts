import { NextRequest } from 'next/server'
import { eq, sql } from 'drizzle-orm'
import { apiOk, apiError, apiRateLimited } from '@/lib/server/auth-helpers'
import { rateLimit, getScopedRateLimitKey } from '@/lib/server/rate-limiter'
import { db } from '@/lib/server/db'
import { siteSettings } from '@/lib/server/schema'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Newsletter signup.
 * Storage: one row per unique email in `site_settings` (key =
 * `newsletter:<email>`) plus a running counter for the admin dashboard.
 * Avoids a schema migration for a simple sign-up list.
 */
export async function POST(req: NextRequest) {
  const rl = rateLimit(getScopedRateLimitKey(req, 'newsletter'), { windowSeconds: 60 * 60, max: 5 })
  if (!rl.success) return apiRateLimited(rl.resetAt)

  try {
    const body = await req.json().catch(() => null)
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''

    if (!email) return apiError('Email is required.')
    if (email.length > 254) return apiError('Email is too long.')
    if (!EMAIL_RE.test(email)) return apiError('Please enter a valid email address.')

    const key = `newsletter:${email}`
    const [existing] = await db
      .select({ key: siteSettings.key })
      .from(siteSettings)
      .where(eq(siteSettings.key, key))
      .limit(1)

    if (existing) {
      return apiOk({ message: 'You\'re already subscribed.', already: true })
    }

    await db
      .insert(siteSettings)
      .values({ key, value: new Date().toISOString() })
      .onConflictDoNothing()

    // Running counter for admin visibility.
    await db
      .insert(siteSettings)
      .values({ key: 'newsletter_count', value: '1' })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: { value: sql`(site_settings.value::int + 1)::text`, updatedAt: new Date() },
      })

    return apiOk({ message: 'Subscribed successfully.' })
  } catch (err) {
    console.error('[newsletter]', err)
    return apiError('Could not subscribe right now. Please try again.', 500)
  }
}