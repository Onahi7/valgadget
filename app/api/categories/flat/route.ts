import { db } from '@/lib/server/db'
import { categories, products } from '@/lib/server/schema'
import { apiOk } from '@/lib/server/auth-helpers'
import { eq, sql, asc } from 'drizzle-orm'

export async function GET() {
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
    productCount: sql<number>`(
      SELECT count(*)
      FROM products p
      WHERE p.is_active = true
        AND (
          p.category_id = ${categories.id}
          OR p.category_id IN (SELECT c2.id FROM categories c2 WHERE c2.parent_id = ${categories.id})
        )
    )::int`,
  }).from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.sortOrder))

  return apiOk(data)
}
