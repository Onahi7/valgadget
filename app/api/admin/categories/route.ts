import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { categories } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { desc, sql, eq } from 'drizzle-orm'
import { withCategoryDisplayImages } from '@/lib/server/category-images'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  const data = await db.select({
    id: categories.id,
    name: categories.name,
    slug: categories.slug,
    description: categories.description,
    image: categories.image,
    icon: categories.icon,
    parentId: categories.parentId,
    isActive: categories.isActive,
    sortOrder: categories.sortOrder,
    createdAt: categories.createdAt,
    updatedAt: categories.updatedAt,
    productCount: sql<number>`(
      select count(*)::int
      from products p
      where p.is_active = true
        and (
          p.category_id = ${categories.id}
          or p.category_id in (select c2.id from categories c2 where c2.parent_id = ${categories.id})
        )
    )`,
  }).from(categories).orderBy(desc(categories.sortOrder), desc(categories.createdAt))
  return apiOk(await withCategoryDisplayImages(data))
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  try {
    const body = await req.json()
    const { name, description, image, icon, parentId, isActive = true, sortOrder = 0 } = body
    const normalizedName = typeof name === 'string' ? name.trim() : ''
    const normalizedParentId = typeof parentId === 'string' && parentId.trim() ? parentId.trim() : null
    if (!normalizedName) return apiError('Category name is required.')

    if (normalizedParentId) {
      const [parent] = await db
        .select({ id: categories.id, parentId: categories.parentId })
        .from(categories)
        .where(eq(categories.id, normalizedParentId))
        .limit(1)
      if (!parent) return apiError('Parent category not found.', 404)
      if (parent.parentId) return apiError('Subcategories can only belong to a main category.')
    }

    let slug = normalizedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    if (!slug) return apiError('Category name must contain letters or numbers.')

    // Ensure slug is unique
    const [existing] = await db.select({ slug: categories.slug }).from(categories).where(eq(categories.slug, slug)).limit(1)
    if (existing) {
      const timestamp = Date.now().toString(36)
      slug = `${slug}-${timestamp}`
    }

    const [cat] = await db.insert(categories).values({
      name: normalizedName,
      slug,
      description,
      image,
      icon,
      parentId: normalizedParentId,
      isActive: Boolean(isActive),
      sortOrder: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0,
    }).returning()
    return apiOk(cat, 201)
  } catch (err) {
    console.error('[admin create category]', err)
    return apiError('Failed to create category.', 500)
  }
}
