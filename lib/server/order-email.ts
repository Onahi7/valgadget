import { db } from '@/lib/server/db'
import { orders, users } from '@/lib/server/schema'
import { sendGuestOrderConfirmationEmail, sendOrderConfirmationEmail } from '@/lib/server/email'
import { eq } from 'drizzle-orm'

type OrderEmailTarget = {
  userId: string | null
  guestEmail: string | null
  reference: string
  total: string | number
}

function formatNaira(value: string | number) {
  return `NGN ${Number(value).toLocaleString()}`
}

export async function sendPurchaseConfirmationForOrder(order: OrderEmailTarget, logLabel = 'order email') {
  if (order.userId) {
    const [user] = await db.select({ email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, order.userId))
      .limit(1)

    if (user) {
      await sendOrderConfirmationEmail(user.email, user.name, order.reference, formatNaira(order.total))
    }
    return
  }

  if (order.guestEmail) {
    await sendGuestOrderConfirmationEmail(order.guestEmail, order.reference, formatNaira(order.total))
    return
  }

  console.warn(`[${logLabel}] No user or guest email for order ${order.reference}`)
}

export async function sendPurchaseConfirmationByReference(reference: string, logLabel = 'order email') {
  const [order] = await db.select({
    userId: orders.userId,
    guestEmail: orders.guestEmail,
    reference: orders.reference,
    total: orders.total,
  })
    .from(orders)
    .where(eq(orders.reference, reference))
    .limit(1)

  if (order) await sendPurchaseConfirmationForOrder(order, logLabel)
}
