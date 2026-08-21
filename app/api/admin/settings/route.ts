/**
 * GET /api/admin/settings  — read all settings as key/value map
 * PUT /api/admin/settings  — upsert multiple settings { settings: { key: value, ... } }
 */
import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { siteSettings } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { getStoreSettings } from '@/lib/server/store-settings'
import { validateStoreSetting } from '@/lib/store-settings'
import { sql } from 'drizzle-orm'
import { logAdminActivity } from '@/lib/server/admin-activity'
import { revalidateTag } from 'next/cache'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  return apiOk(await getStoreSettings())
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  try {
    const { settings } = await req.json() as { settings: Record<string, unknown> }
    if (!settings || typeof settings !== 'object') return apiError('settings object required', 400)

    const validated = []
    for (const [key, value] of Object.entries(settings)) {
      const result = validateStoreSetting(key, value)
      if ('error' in result) return apiError(result.error, 422)
      validated.push(result)
    }

    if (validated.length > 0) {
      await db.insert(siteSettings)
        .values(validated.map(({ key, value }) => ({ key, value, updatedAt: new Date() })))
        .onConflictDoUpdate({
          target: siteSettings.key,
          set: { value: sql`excluded.value`, updatedAt: new Date() },
        })
    }
    revalidateTag('store-settings', { expire: 0 })
    await logAdminActivity(auth.user.sub, 'updated', 'store settings', null, `${validated.length} settings saved`)

    return apiOk({ updated: validated.length, settings: await getStoreSettings() })
  } catch (err) {
    console.error('[admin/settings PUT]', err)
    return apiError('Failed to save settings', 500)
  }
}
