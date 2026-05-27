import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { orders, products } from '@/lib/server/schema'
import { requireAuth, apiOk } from '@/lib/server/auth-helpers'
import { inArray, sql } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  const { searchParams } = new URL(req.url)
  const limit = Math.max(1, Math.min(20, Number(searchParams.get('limit') ?? '5')))

  const rows = await db.execute(sql`
    select
      item->>'productId' as product_id,
      sum((item->>'qty')::int) as total_sold,
      sum(((item->>'price')::numeric) * (item->>'qty')::int) as revenue
    from ${orders}, jsonb_array_elements(${orders.items}::jsonb) as item
    where ${orders.paymentStatus} = 'paid'
    group by item->>'productId'
    order by total_sold desc
    limit ${limit}
  `)

  const ids = rows.rows.map((r: any) => r.product_id).filter(Boolean)
  if (ids.length === 0) return apiOk([])

  const productRows = await db.select({
    id: products.id,
    name: products.name,
    slug: products.slug,
    images: products.images,
  })
    .from(products)
    .where(inArray(products.id, ids))

  const byId = new Map(productRows.map(p => [p.id, p]))

  const result = rows.rows
    .map((r: any) => {
      const p = byId.get(r.product_id as string)
      if (!p) return null
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        images: p.images,
        totalSold: Number(r.total_sold ?? 0),
        revenue: Number(r.revenue ?? 0),
      }
    })
    .filter(Boolean)

  return apiOk(result)
}
