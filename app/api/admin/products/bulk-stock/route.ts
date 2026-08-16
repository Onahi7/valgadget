import { NextRequest } from 'next/server'
import { and, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { requireAuth, apiError, apiOk } from '@/lib/server/auth-helpers'
import { db } from '@/lib/server/db'
import { products, productVariants } from '@/lib/server/schema'
import { validationErrors } from '@/lib/server/admin-product'

const requestSchema = z.object({
  updates: z.array(z.object({
    id: z.string().min(1),
    stock: z.number().int().min(0),
  })).min(1).max(500),
}).superRefine(({ updates }, ctx) => {
  const ids = new Set<string>()
  updates.forEach((update, index) => {
    if (ids.has(update.id)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['updates', index, 'id'], message: 'Each product can only appear once.' })
    }
    ids.add(update.id)
  })
})

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  try {
    const parsed = requestSchema.safeParse(await req.json())
    if (!parsed.success) return apiError('Invalid stock updates.', 422, validationErrors(parsed.error))

    const ids = parsed.data.updates.map(update => update.id)
    const variantProducts = await db.selectDistinct({ productId: productVariants.productId })
      .from(productVariants)
      .where(and(inArray(productVariants.productId, ids), eq(productVariants.isActive, true)))
    const managedIds = new Set(variantProducts.map(row => row.productId))
    const directUpdates = parsed.data.updates.filter(update => !managedIds.has(update.id))

    const updatedIds = await db.transaction(async tx => {
      const rows = await Promise.all(directUpdates.map(update => tx.update(products)
        .set({ stock: update.stock, updatedAt: new Date() })
        .where(eq(products.id, update.id))
        .returning({ id: products.id })))
      return rows.flat().map(row => row.id)
    })

    return apiOk({
      updated: updatedIds.length,
      updatedIds,
      skippedVariantManaged: parsed.data.updates.filter(update => managedIds.has(update.id)).map(update => update.id),
    })
  } catch (error) {
    console.error('[admin bulk stock]', error)
    return apiError('Failed to update stock.', 500)
  }
}
