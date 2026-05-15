import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { categories } from '@/lib/server/schema'
import { apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq, sql } from 'drizzle-orm'

export async function GET(_request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params

  const [category] = await db.select({
    id: categories.id, name: categories.name, slug: categories.slug,
    description: categories.description, image: categories.image, icon: categories.icon,
    parentId: categories.parentId, isActive: categories.isActive,
    sortOrder: categories.sortOrder, createdAt: categories.createdAt, updatedAt: categories.updatedAt,
    productCount: sql<number>`(
      select count(*)
      from products p
      where p.is_active = true
        and (
          p.category_id = categories.id
          or p.category_id in (select c2.id from categories c2 where c2.parent_id = categories.id)
        )
    )::int`,
  }).from(categories).where(eq(categories.slug, slug)).limit(1)

  if (!category) return apiError('Category not found.', 404)
  return apiOk(category)
}
