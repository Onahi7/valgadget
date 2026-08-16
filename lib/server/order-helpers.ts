import type { orders } from '@/lib/server/schema'

type OrderRow = typeof orders.$inferSelect

/** Convert numeric string fields to numbers for API responses. */
export function numericOrder(o: OrderRow) {
  return {
    ...o,
    subtotal: Number(o.subtotal),
    discount: Number(o.discount),
    shipping: Number(o.shipping),
    tax: Number(o.tax),
    total: Number(o.total),
  }
}
