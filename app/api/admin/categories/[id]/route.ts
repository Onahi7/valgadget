import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { categories } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { and, eq, ne } from 'drizzle-orm'

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  const { id } = await context.params
  try {
    const body = await req.json()
    const { name, description, image, icon, parentId, isActive, sortOrder } = body
    const [current] = await db
      .select({ id: categories.id, parentId: categories.parentId })
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1)
    if (!current) return apiError('Category not found.', 404)

    const normalizedName = name !== undefined ? (typeof name === 'string' ? name.trim() : '') : undefined
    if (normalizedName !== undefined && !normalizedName) return apiError('Category name is required.')

    let normalizedParentId: string | null | undefined
    if (parentId !== undefined) {
      normalizedParentId = typeof parentId === 'string' && parentId.trim() ? parentId.trim() : null
      if (normalizedParentId === id) return apiError('A category cannot be its own parent.')

      if (normalizedParentId) {
        const [parent] = await db
          .select({ id: categories.id, parentId: categories.parentId })
          .from(categories)
          .where(eq(categories.id, normalizedParentId))
          .limit(1)
        if (!parent) return apiError('Parent category not found.', 404)
        if (parent.parentId) return apiError('Subcategories can only belong to a main category.')

        const [child] = await db
          .select({ id: categories.id })
          .from(categories)
          .where(and(eq(categories.parentId, id), ne(categories.id, id)))
          .limit(1)
        if (child) return apiError('Move or remove this category’s subcategories before making it a subcategory.')
      }
    }

    const [updated] = await db.update(categories).set({
      ...(normalizedName !== undefined && { name: normalizedName }),
      ...(description !== undefined && { description }),
      ...(image       !== undefined && { image }),
      ...(icon        !== undefined && { icon }),
      ...(normalizedParentId !== undefined && { parentId: normalizedParentId }),
      ...(isActive    !== undefined && { isActive }),
      ...(sortOrder   !== undefined && { sortOrder: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0 }),
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
