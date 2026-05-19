import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { products, categories } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  const { id } = await context.params
  const [product] = await db.select({
    id: products.id,
    name: products.name,
    slug: products.slug,
    description: products.description,
    shortDescription: products.shortDescription,
    specs: products.specs,
    price: products.price,
    comparePrice: products.comparePrice,
    cost: products.cost,
    images: products.images,
    categoryId: products.categoryId,
    stock: products.stock,
    lowStockThreshold: products.lowStockThreshold,
    sku: products.sku,
    rating: products.rating,
    reviewCount: products.reviewCount,
    tags: products.tags,
    featured: products.featured,
    isNew: products.isNew,
    isActive: products.isActive,
    createdAt: products.createdAt,
    updatedAt: products.updatedAt,
    category: { id: categories.id, name: categories.name, slug: categories.slug },
  })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.id, id))
    .limit(1)

  if (!product) return apiError('Product not found.', 404)
  return apiOk(numericProduct(product))
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  const { id } = await context.params
  try {
    const body = await req.json()
    const { name, description, shortDescription, specs, price, comparePrice, cost, categoryId, stock, sku, tags, featured, isNew, isActive, images } = body

    const slug = name
      ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      : undefined

    const [updated] = await db.update(products).set({
      ...(name        && { name, slug }),
      ...(description !== undefined && { description }),
      ...(shortDescription !== undefined && { shortDescription }),
      ...(specs !== undefined && { specs }),
      ...(price       !== undefined && { price: String(price) }),
      ...(comparePrice !== undefined && { comparePrice: comparePrice ? String(comparePrice) : null }),
      ...(cost        !== undefined && { cost: cost ? String(cost) : null }),
      ...(categoryId  !== undefined && { categoryId }),
      ...(stock       !== undefined && { stock }),
      ...(sku         !== undefined && { sku }),
      ...(tags        !== undefined && { tags }),
      ...(featured    !== undefined && { featured }),
      ...(isNew       !== undefined && { isNew }),
      ...(isActive    !== undefined && { isActive }),
      ...(images      !== undefined && { images }),
      updatedAt: new Date(),
    }).where(eq(products.id, id)).returning()

    if (!updated) return apiError('Product not found.', 404)
    return apiOk(numericProduct(updated))
  } catch (err) {
    console.error('[admin update product]', err)
    return apiError('Failed to update product.', 500)
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  const { id } = await context.params
  const [deleted] = await db.update(products).set({ isActive: false, updatedAt: new Date() })
    .where(eq(products.id, id)).returning({ id: products.id })

  if (!deleted) return apiError('Product not found.', 404)
  return apiOk({ message: 'Product deactivated.' })
}

function numericProduct(p: Record<string, unknown>) {
  const images = Array.isArray(p.images) ? p.images.filter((src): src is string => typeof src === 'string') : []
  const displayImage = images.find(src => !src.includes('source.unsplash.com')) ?? null

  return {
    ...p,
    images,
    displayImage,
    imageStatus: displayImage ? 'ready' : 'needs_image',
    price: p.price ? Number(p.price) : undefined,
    comparePrice: p.comparePrice ? Number(p.comparePrice) : undefined,
    cost: p.cost ? Number(p.cost) : undefined,
    rating: p.rating ? Number(p.rating) : 0,
  }
}
