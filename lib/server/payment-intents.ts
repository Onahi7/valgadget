import { orders } from '@/lib/server/schema'

export type PaymentMethod =
  | 'card'
  | 'bank_transfer'
  | 'mobile_money'
  | 'paypal'
  | 'crypto'
  | 'cod'

export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled' | 'refunded'

export interface PaymentIntentView {
  id: string
  orderId: string
  amount: number
  currency: string
  status: PaymentStatus
  method: PaymentMethod
  clientSecret?: string
  redirectUrl?: string
  reference: string
  metadata?: Record<string, string>
  createdAt: string
  updatedAt: string
}

function mapPaymentMethod(value?: string | null): PaymentMethod {
  if (!value) return 'card'
  if (value.startsWith('crypto')) return 'crypto'
  if (value === 'cod') return 'cod'
  if (value === 'paypal') return 'paypal'
  if (value === 'mobile_money') return 'mobile_money'
  if (value === 'bank_transfer') return 'bank_transfer'
  return 'card'
}

function mapPaymentStatus(value?: string | null): PaymentStatus {
  if (!value) return 'pending'
  if (value === 'paid') return 'succeeded'
  if (value === 'pending_verification') return 'processing'
  if (value === 'pending') return 'processing'
  if (value === 'failed') return 'failed'
  if (value === 'refunded') return 'refunded'
  if (value === 'cancelled') return 'cancelled'
  return 'pending'
}

export function toPaymentIntent(order: typeof orders.$inferSelect, redirectUrl?: string): PaymentIntentView {
  return {
    id: order.reference,
    orderId: order.id,
    amount: Number(order.total),
    currency: 'NGN',
    status: mapPaymentStatus(order.paymentStatus),
    method: mapPaymentMethod(order.paymentMethod),
    reference: order.reference,
    redirectUrl,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  }
}
