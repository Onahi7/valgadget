import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { products, categories } from '@/lib/server/schema'
import { apiOk } from '@/lib/server/auth-helpers'
import { eq, desc, and } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  const limit = Math.min(20, Math.max(1, Number(new URL(request.url).searchParams.get('limit') ?? '8')))

  const data = await db.select({
    id: products.id, name: products.name, slug: products.slug,
    price: products.price, comparePrice: products.comparePrice,
    images: products.images, stock: products.stock, sku: products.sku,
    rating: products.rating, reviewCount: products.reviewCount, tags: products.tags,
    featured: products.featured, isNew: products.isNew, categoryId: products.categoryId,
    category: { id: categories.id, name: categories.name, slug: categories.slug },
  })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.featured, true), eq(products.isActive, true)))
    .orderBy(desc(products.createdAt))
    .limit(limit)

  return apiOk(data.map(p => ({ ...p, price: Number(p.price), comparePrice: p.comparePrice ? Number(p.comparePrice) : undefined, rating: Number(p.rating) })))
}
