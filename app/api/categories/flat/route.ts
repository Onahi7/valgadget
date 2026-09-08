import { db } from '@/lib/server/db'
import { categories } from '@/lib/server/schema'
import { apiOk } from '@/lib/server/auth-helpers'
import { eq, sql, asc } from 'drizzle-orm'
import { withCategoryDisplayImages } from '@/lib/server/category-images'
import { withDescendantProductCounts } from '@/lib/category-hierarchy'

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
      select count(*)::int from products p
      where p.is_active = true and p.category_id = categories.id
    )`,
  }).from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(asc(categories.sortOrder), asc(categories.name))

  return apiOk(await withCategoryDisplayImages(withDescendantProductCounts(data)))
}
