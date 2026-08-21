import { db } from '@/lib/server/db'
import { categories } from '@/lib/server/schema'
import { apiOk } from '@/lib/server/auth-helpers'
import { and, eq, sql, asc } from 'drizzle-orm'
import { withCategoryDisplayImages } from '@/lib/server/category-images'

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
      SELECT count(*)::int
      FROM products p
      WHERE p.is_active = true
        AND (
          p.category_id = categories.id
          OR p.category_id IN (SELECT c2.id FROM categories c2 WHERE c2.parent_id = categories.id)
        )
    )`,
  }).from(categories).where(and(
    eq(categories.isActive, true),
    sql`exists (
      select 1
      from products p
      where p.is_active = true
        and (
          p.category_id = ${categories.id}
          or p.category_id in (select c2.id from categories c2 where c2.parent_id = ${categories.id} and c2.is_active = true)
        )
    )`,
  )).orderBy(asc(categories.sortOrder))

  return apiOk(await withCategoryDisplayImages(data))
}
