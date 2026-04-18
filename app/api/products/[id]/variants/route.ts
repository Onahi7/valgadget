import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { productVariants } from '@/lib/server/schema'
import { apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq, and } from 'drizzle-orm'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const variants = await db
      .select()
      .from(productVariants)
      .where(and(
        eq(productVariants.productId, id),
        eq(productVariants.isActive, true)
      ))
      .orderBy(productVariants.sortOrder)

    return apiOk(variants.map(v => ({
      ...v,
      price: v.price ? Number(v.price) : null,
    })))
  } catch (err) {
    console.error('[get variants]', err)
    return apiError('Failed to fetch variants', 500)
  }
}
