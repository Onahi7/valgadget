import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { products, categories } from '@/lib/server/schema'
import { apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq } from 'drizzle-orm'

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params

  const [product] = await db.select({
    id: products.id, name: products.name, slug: products.slug,
    description: products.description, shortDescription: products.shortDescription,
    specs: products.specs,
    price: products.price, comparePrice: products.comparePrice,
    images: products.images, categoryId: products.categoryId,
    stock: products.stock, sku: products.sku, rating: products.rating,
    reviewCount: products.reviewCount, tags: products.tags,
    featured: products.featured, isNew: products.isNew, isActive: products.isActive,
    createdAt: products.createdAt, updatedAt: products.updatedAt,
    category: { id: categories.id, name: categories.name, slug: categories.slug },
  })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.id, id))
    .limit(1)

  if (!product) return apiError('Product not found.', 404)
  return apiOk({ ...product, price: Number(product.price), comparePrice: product.comparePrice ? Number(product.comparePrice) : undefined, rating: Number(product.rating) })
}
