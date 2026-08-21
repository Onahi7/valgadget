import { db } from '@/lib/server/db'
import { categories } from '@/lib/server/schema'
import { apiOk } from '@/lib/server/auth-helpers'
import { and, eq, asc, sql } from 'drizzle-orm'
import { withCategoryDisplayImages } from '@/lib/server/category-images'

export async function GET() {
  const data = await db.select({
    id: categories.id, name: categories.name, slug: categories.slug,
    description: categories.description, image: categories.image,
    icon: categories.icon, parentId: categories.parentId,
    isActive: categories.isActive, sortOrder: categories.sortOrder,
    createdAt: categories.createdAt, updatedAt: categories.updatedAt,
    productCount: sql<number>`(
      select count(*) from products
      where products.is_active = true
      and (
        products.category_id = categories.id
        or products.category_id in (select c2.id from categories c2 where c2.parent_id = categories.id)
      )
    )::int`,
  })
    .from(categories)
    .where(and(
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
    ))
    .orderBy(asc(categories.sortOrder), asc(categories.name))

  return apiOk(await withCategoryDisplayImages(data))
}
