import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { products, categories, productVariants } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq } from 'drizzle-orm'
import {
  nullableValue,
  normalizeProductCondition,
  postgresErrorCode,
  updateAdminProductSchema,
  validationErrors,
  withConditionTag,
} from '@/lib/server/admin-product'

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  const { id } = await context.params
  const productQuery = db.select({
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
    condition: products.condition,
    featured: products.featured,
    isNew: products.isNew,
    isActive: products.isActive,
    createdAt: products.createdAt,
    updatedAt: products.updatedAt,
    brand: products.brand,
    barcode: products.barcode,
    category: { id: categories.id, name: categories.name, slug: categories.slug },
  })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.id, id))
    .limit(1)

  const variantsQuery = db.select().from(productVariants)
    .where(eq(productVariants.productId, id))
    .orderBy(productVariants.sortOrder)

  const [[product], variantRows] = await Promise.all([productQuery, variantsQuery])

  if (!product) return apiError('Product not found.', 404)
  return apiOk({
    ...numericProduct(product),
    variants: variantRows.map(variant => ({
      ...variant,
      price: variant.price ? Number(variant.price) : undefined,
    })),
  })
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  const { id } = await context.params
  try {
    const parsed = updateAdminProductSchema.safeParse(await req.json())
    if (!parsed.success) return apiError('Please correct the highlighted product fields.', 422, validationErrors(parsed.error))

    const input = parsed.data
    const [existing] = await db.select({
      id: products.id,
      price: products.price,
      comparePrice: products.comparePrice,
      tags: products.tags,
      condition: products.condition,
    }).from(products).where(eq(products.id, id)).limit(1)
    if (!existing) return apiError('Product not found.', 404)

    if (input.categoryId) {
      const [category] = await db.select({ id: categories.id }).from(categories).where(eq(categories.id, input.categoryId)).limit(1)
      if (!category) return apiError('Selected category does not exist.', 422, { categoryId: ['Select a valid category.'] })
    }

    const finalPrice = input.price ?? Number(existing.price)
    const finalComparePrice = input.comparePrice === undefined
      ? (existing.comparePrice ? Number(existing.comparePrice) : undefined)
      : (input.comparePrice ?? undefined)
    if (finalComparePrice && finalComparePrice < finalPrice) {
      return apiError('Compare price must be at least the selling price.', 422, { comparePrice: ['Compare price must be at least the selling price.'] })
    }

    const condition = input.condition ?? normalizeProductCondition(existing.condition)
    const tags = withConditionTag(input.tags ?? existing.tags, condition)
    const variantStock = input.variants?.filter(variant => variant.isActive).reduce((sum, variant) => sum + variant.stock, 0)

    const updated = await db.transaction(async tx => {
      const [saved] = await tx.update(products).set({
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.shortDescription !== undefined && { shortDescription: nullableValue(input.shortDescription) }),
        ...(input.specs !== undefined && { specs: input.specs }),
        ...(input.price !== undefined && { price: String(input.price) }),
        ...(input.comparePrice !== undefined && { comparePrice: input.comparePrice ? String(input.comparePrice) : null }),
        ...(input.cost !== undefined && { cost: input.cost !== null ? String(input.cost) : null }),
        ...(input.categoryId !== undefined && { categoryId: nullableValue(input.categoryId) }),
        ...(input.variants !== undefined
          ? { stock: variantStock ?? 0 }
          : input.stock !== undefined ? { stock: input.stock } : {}),
        ...(input.lowStockThreshold !== undefined && { lowStockThreshold: input.lowStockThreshold }),
        ...(input.sku !== undefined && { sku: input.sku }),
        ...(input.barcode !== undefined && { barcode: nullableValue(input.barcode) }),
        ...(input.brand !== undefined && { brand: nullableValue(input.brand) }),
        tags,
        condition,
        ...(input.featured !== undefined && { featured: input.featured }),
        ...(input.isNew !== undefined && { isNew: input.isNew }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        ...(input.images !== undefined && { images: input.images }),
        updatedAt: new Date(),
      }).where(eq(products.id, id)).returning()

      if (input.variants !== undefined) {
        await tx.delete(productVariants).where(eq(productVariants.productId, id))
        if (input.variants.length > 0) {
          await tx.insert(productVariants).values(input.variants.map((variant, index) => ({
            productId: id,
            name: variant.name,
            sku: variant.sku,
            price: variant.price ? String(variant.price) : null,
            stock: variant.stock,
            attributes: variant.attributes,
            image: nullableValue(variant.image),
            isActive: variant.isActive,
            sortOrder: index,
          })))
        }
      }

      return saved
    })

    if (!updated) return apiError('Product not found.', 404)
    return apiOk({ ...numericProduct(updated), ...(input.variants !== undefined ? { variants: input.variants } : {}) })
  } catch (err) {
    console.error('[admin update product]', err)
    if (postgresErrorCode(err) === '23505') return apiError('A product or variant already uses that SKU.', 409)
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
