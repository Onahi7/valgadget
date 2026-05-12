import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { categories } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq } from 'drizzle-orm'

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  try {
    const body = await req.json()
    const items = Array.isArray(body?.items) ? body.items : []

    if (!items.length) return apiError('items are required.')

    for (const item of items) {
      if (!item?.id || typeof item.sortOrder !== 'number') {
        return apiError('Each item must include id and sortOrder.', 400)
      }
    }

    for (const item of items) {
      await db
        .update(categories)
        .set({ sortOrder: item.sortOrder, updatedAt: new Date() })
        .where(eq(categories.id, item.id))
    }

    return apiOk({ updated: items.length })
  } catch (err) {
    console.error('[admin reorder categories]', err)
    return apiError('Failed to reorder categories.', 500)
  }
}
