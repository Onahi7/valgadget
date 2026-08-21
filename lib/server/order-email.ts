import { db } from '@/lib/server/db'
import { orders, users, type OrderItem } from '@/lib/server/schema'
import { sendGuestOrderConfirmationEmail, sendOrderConfirmationEmail, sendOrderStatusUpdateEmail, sendPaymentConfirmedEmail, sendRefundEmail } from '@/lib/server/email'
import { eq } from 'drizzle-orm'
import { getStoreSettings } from '@/lib/server/store-settings'
import { settingIsTrue } from '@/lib/store-settings'
import { createGuestOrderAccessToken } from '@/lib/server/guest-order-access'

type OrderEmailTarget = { id?: string; userId: string | null; guestEmail: string | null; reference: string; total: string | number; items?: OrderItem[]; paymentMethod?: string | null }
const formatNaira = (value: string | number) => `₦${Number(value).toLocaleString()}`

async function recipientForOrder(order: { userId: string | null; guestEmail: string | null }) {
  if (order.userId) {
    const [user] = await db.select({ email: users.email, name: users.name }).from(users).where(eq(users.id, order.userId)).limit(1)
    return user ?? null
  }
  return order.guestEmail ? { email: order.guestEmail, name: 'there' } : null
}

export async function sendPurchaseConfirmationForOrder(order: OrderEmailTarget, logLabel = 'order email') {
  const settings = await getStoreSettings()
  if (!settingIsTrue(settings, 'emailOrderConfirm')) return
  const items = order.items?.map(({ name, qty, price }) => ({ name, qty, price }))
  if (order.userId) {
    const recipient = await recipientForOrder(order)
    if (recipient) await sendOrderConfirmationEmail(recipient.email, recipient.name, order.reference, formatNaira(order.total), items, order.paymentMethod)
    return
  }
  if (order.guestEmail) {
    const orderId = order.id ?? (await db.select({ id: orders.id }).from(orders).where(eq(orders.reference, order.reference)).limit(1))[0]?.id
    const token = orderId ? createGuestOrderAccessToken(orderId, order.guestEmail) : ''
    await sendGuestOrderConfirmationEmail(order.guestEmail, order.reference, formatNaira(order.total), orderId, token, items, order.paymentMethod)
    return
  }
  console.warn(`[${logLabel}] No recipient for order ${order.reference}`)
}

export async function sendPurchaseConfirmationByReference(reference: string, logLabel = 'order email') {
  const [order] = await db.select({ id: orders.id, userId: orders.userId, guestEmail: orders.guestEmail, reference: orders.reference, total: orders.total, items: orders.items, paymentMethod: orders.paymentMethod }).from(orders).where(eq(orders.reference, reference)).limit(1)
  if (order) await sendPurchaseConfirmationForOrder(order, logLabel)
}

export async function sendShippingUpdateForOrder(orderId: string, status: string) {
  const settings = await getStoreSettings()
  if (!settingIsTrue(settings, 'emailShippingUpdate')) return
  const [order] = await db.select({ userId: orders.userId, guestEmail: orders.guestEmail, reference: orders.reference, trackingNumber: orders.trackingNumber, trackingUrl: orders.trackingUrl }).from(orders).where(eq(orders.id, orderId)).limit(1)
  if (!order) return
  const recipient = await recipientForOrder(order)
  if (recipient) await sendOrderStatusUpdateEmail(recipient.email, recipient.name, order.reference, status, order.trackingNumber, order.trackingUrl)
}

export async function sendPaymentConfirmationForOrder(orderId: string) {
  const [order] = await db.select({ id: orders.id, userId: orders.userId, guestEmail: orders.guestEmail, reference: orders.reference, total: orders.total }).from(orders).where(eq(orders.id, orderId)).limit(1)
  if (!order) return
  const recipient = await recipientForOrder(order)
  if (!recipient) return
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const actionUrl = order.userId ? `${baseUrl}/account/orders` : `${baseUrl}/orders/guest/${order.id}?token=${createGuestOrderAccessToken(order.id, order.guestEmail!)}`
  await sendPaymentConfirmedEmail(recipient.email, recipient.name, order.reference, formatNaira(order.total), actionUrl)
}

export async function sendRefundConfirmationForOrder(orderId: string, amount: string | number, reason: string, providerStatus: string) {
  const [order] = await db.select({ userId: orders.userId, guestEmail: orders.guestEmail, reference: orders.reference }).from(orders).where(eq(orders.id, orderId)).limit(1)
  if (!order) return
  const recipient = await recipientForOrder(order)
  if (recipient) await sendRefundEmail(recipient.email, recipient.name, order.reference, formatNaira(amount), reason, providerStatus)
}
