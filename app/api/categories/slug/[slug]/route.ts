import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { categories } from '@/lib/server/schema'
import { fail, ok } from '@/lib/server/http'
import { eq, sql } from 'drizzle-orm'

export async function GET(_request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params

  const [category] = await db.select({
    id: categories.id, name: categories.name, slug: categories.slug,
    description: categories.description, image: categories.image, icon: categories.icon,
    parentId: categories.parentId, isActive: categories.isActive,
    sortOrder: categories.sortOrder, createdAt: categories.createdAt, updatedAt: categories.updatedAt,
    productCount: sql<number>`(select count(*) from products where products.category_id = categories.id and products.is_active = true)::int`,
  }).from(categories).where(eq(categories.slug, slug)).limit(1)

  if (!category) return fail('Category not found.', 404)
  return ok(category)
}
