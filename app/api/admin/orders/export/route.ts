/**
 * GET /api/admin/orders/export?status=&search=
 * Returns orders as CSV download.
 */
import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { orders } from '@/lib/server/schema'
import { requireAuth } from '@/lib/server/auth-helpers'
import { desc, eq, ilike, and, type SQL } from 'drizzle-orm'

function escapeCsv(val: unknown): string {
  const s = String(val ?? '')
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`
  return s
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? undefined
  const search = searchParams.get('search') ?? undefined

  const conditions: SQL[] = []
  if (status) conditions.push(eq(orders.status, status))
  if (search) conditions.push(ilike(orders.reference, `%${search}%`))

  const where = conditions.length ? and(...conditions) : undefined

  const data = await db.select().from(orders).where(where).orderBy(desc(orders.createdAt)).limit(5000)

  const header = ['Reference', 'Status', 'Payment Status', 'Payment Method', 'Subtotal', 'Shipping', 'Tax', 'Discount', 'Total', 'Coupon', 'Affiliate', 'Items', 'Customer Name', 'City', 'State', 'Country', 'Created At']

  const rows = data.map(o => {
    const addr = o.shippingAddress as Record<string, unknown> | null
    const items = (o.items as unknown as Array<Record<string, unknown>>) ?? []
    return [
      o.reference, o.status, o.paymentStatus, o.paymentMethod ?? '',
      o.subtotal, o.shipping, o.tax, o.discount, o.total,
      o.couponCode ?? '', o.affiliateCode ?? '',
      items.map(i => `${i.name ?? ''} x${i.qty ?? 0}`).join('; '),
      addr?.fullName ?? '', addr?.city ?? '', addr?.state ?? '', addr?.country ?? '',
      o.createdAt ? new Date(o.createdAt).toISOString() : '',
    ].map(escapeCsv).join(',')
  })

  const csv = [header.map(escapeCsv).join(','), ...rows].join('\n')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
