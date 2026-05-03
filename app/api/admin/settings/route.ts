/**
 * GET /api/admin/settings  — read all settings as key/value map
 * PUT /api/admin/settings  — upsert multiple settings { settings: { key: value, ... } }
 */
import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { siteSettings } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq, sql } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  const rows = await db.select().from(siteSettings)
  const map: Record<string, string> = {}
  for (const row of rows) map[row.key] = row.value

  return apiOk(map)
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  try {
    const { settings } = await req.json() as { settings: Record<string, string> }
    if (!settings || typeof settings !== 'object') return apiError('settings object required', 400)

    // Upsert each key
    for (const [key, value] of Object.entries(settings)) {
      if (!key || typeof value !== 'string') continue
      await db.insert(siteSettings).values({ key, value, updatedAt: new Date() })
        .onConflictDoUpdate({ target: siteSettings.key, set: { value, updatedAt: new Date() } })
    }

    return apiOk({ updated: Object.keys(settings).length })
  } catch (err) {
    console.error('[admin/settings PUT]', err)
    return apiError('Failed to save settings', 500)
  }
}
