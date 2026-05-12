import { db } from '@/lib/server/db'
import { categories, products } from '@/lib/server/schema'
import { ok } from '@/lib/server/http'
import { eq, asc, sql } from 'drizzle-orm'

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
    .where(eq(categories.isActive, true))
    .orderBy(asc(categories.sortOrder), asc(categories.name))

  return ok(data)
}
