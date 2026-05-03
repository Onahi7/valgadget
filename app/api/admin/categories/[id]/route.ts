import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { categories } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq } from 'drizzle-orm'

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  const { id } = await context.params
  try {
    const body = await req.json()
    const { name, description, image, icon, parentId, isActive, sortOrder } = body
    const slug = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : undefined

    const [updated] = await db.update(categories).set({
      ...(name        !== undefined && { name, slug }),
      ...(description !== undefined && { description }),
      ...(image       !== undefined && { image }),
      ...(icon        !== undefined && { icon }),
      ...(parentId    !== undefined && { parentId }),
      ...(isActive    !== undefined && { isActive }),
      ...(sortOrder   !== undefined && { sortOrder }),
      updatedAt: new Date(),
    }).where(eq(categories.id, id)).returning()

    if (!updated) return apiError('Category not found.', 404)
    return apiOk(updated)
  } catch (err) {
    console.error('[admin update category]', err)
    return apiError('Failed to update category.', 500)
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  const { id } = await context.params
  const [deleted] = await db.delete(categories).where(eq(categories.id, id)).returning({ id: categories.id })
  if (!deleted) return apiError('Category not found.', 404)
  return apiOk({ message: 'Category deleted.' })
}
