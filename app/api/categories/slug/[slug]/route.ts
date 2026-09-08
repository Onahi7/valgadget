import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { categories } from '@/lib/server/schema'
import { apiOk, apiError } from '@/lib/server/auth-helpers'
import { sql } from 'drizzle-orm'
import { withDescendantProductCounts } from '@/lib/category-hierarchy'

export async function GET(_request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params

  const data = await db.select({
    id: categories.id, name: categories.name, slug: categories.slug,
    description: categories.description, image: categories.image, icon: categories.icon,
    parentId: categories.parentId, isActive: categories.isActive,
    sortOrder: categories.sortOrder, createdAt: categories.createdAt, updatedAt: categories.updatedAt,
    productCount: sql<number>`(
      select count(*)::int from products p
      where p.is_active = true and p.category_id = categories.id
    )`,
  }).from(categories)

  const category = withDescendantProductCounts(data).find(item => item.slug === slug)

  if (!category) return apiError('Category not found.', 404)
  return apiOk(category)
}
