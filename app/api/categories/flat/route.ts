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
      SELECT count(*) FROM products WHERE category_id = ${categories.id} AND is_active = true
    )::int`,
  }).from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.sortOrder))

  return apiOk(data)
}
