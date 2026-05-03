import { api } from '@/lib/api-client'

// ─── Types ────────────────────────────────────────────────────────────────────

export type PaymentMethod =
  | 'card'
  | 'bank_transfer'
  | 'mobile_money'
  | 'paypal'
  | 'crypto'
  | 'cod'                // cash on delivery

export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled' | 'refunded'

export interface PaymentIntent {
  id: string
  orderId: string
  amount: number
  currency: string
  status: PaymentStatus
  method: PaymentMethod
  clientSecret?: string   // Stripe
  redirectUrl?: string    // for redirect-based flows (PayPal, Mobile Money)
  reference: string
  metadata?: Record<string, string>
  createdAt: string
  updatedAt: string
}

export interface InitiatePaymentPayload {
  orderId: string
  method: PaymentMethod
  returnUrl?: string      // where to redirect after 3DS / external payment
  cancelUrl?: string
}

export interface RefundPayload {
  orderId: string
  amount?: number          // partial refund; omit for full
  reason?: string
}

export interface CouponValidation {
  code: string
  isValid: boolean
  discountType: 'fixed' | 'percent'
  discountValue: number
  discountAmount: number  // computed against cart
  minOrderAmount?: number
  message?: string
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const paymentService = {
  /** Start a payment intent for an order */
  initiate: (payload: InitiatePaymentPayload) =>
    api.post<PaymentIntent>('/payments/initiate', payload),

  /** Poll payment status */
  getStatus: (paymentId: string) =>
    api.get<PaymentIntent>(`/payments/${paymentId}`),

  /** Get payment record by order ID */
  getByOrder: (orderId: string) =>
    api.get<PaymentIntent>(`/payments/order/${orderId}`),

  /** Validate a coupon code against a cart subtotal */
  validateCoupon: (code: string, cartTotal: number) =>
    api.post<CouponValidation>('/payments/coupons/validate', { code, cartTotal }),

  /** Webhook confirmation (typically called by your backend, exposed for testing) */
  confirmWebhook: (payload: Record<string, unknown>) =>
    api.post<{ received: boolean }>('/payments/webhook', payload),

  // ── Admin ──────────────────────────────────────────────────────────────────

  /** [Admin] Issue a refund */
  refund: (payload: RefundPayload) =>
    api.post<PaymentIntent>('/admin/payments/refund', payload),

  /** [Admin] List all payment intents */
  getAll: (params?: { page?: number; limit?: number; status?: PaymentStatus; method?: PaymentMethod }) =>
    api.get<{ data: PaymentIntent[]; total: number; page: number; totalPages: number }>(
      '/admin/payments',
      params
    ),

  /** [Admin] Manage coupon codes */
  getCoupons: () =>
    api.get<Coupon[]>('/admin/coupons'),

  createCoupon: (payload: Partial<Coupon>) =>
    api.post<Coupon>('/admin/coupons', payload),

  updateCoupon: (id: string, payload: Partial<Coupon>) =>
    api.put<Coupon>(`/admin/coupons/${id}`, payload),

  deleteCoupon: (id: string) =>
    api.delete<{ message: string }>(`/admin/coupons/${id}`),
}

// ── Coupon type ──────────────────────────────────────────────────────────────

export interface Coupon {
  id: string
  code: string
  description?: string
  discountType: 'fixed' | 'percent'
  discountValue: number
  minOrderAmount?: number
  maxUses?: number
  usedCount: number
  isActive: boolean
  expiresAt?: string
  createdAt: string
}
