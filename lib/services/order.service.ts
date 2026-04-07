import { api } from '@/lib/api-client'

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export interface Address {
  fullName: string
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
  phone: string
}

export interface OrderItem {
  id: string
  productId: string
  product: {
    id: string
    name: string
    slug: string
    images: string[]
    price: number
    sku: string
  }
  quantity: number
  unitPrice: number
  totalPrice: number
  variant?: string
}

export interface Order {
  id: string
  reference: string
  userId: string
  user?: { id: string; name: string; email: string }
  items: OrderItem[]
  subtotal: number
  shippingCost: number
  tax: number
  discount: number
  total: number
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod: string
  shippingAddress: Address
  trackingNumber?: string
  trackingUrl?: string
  couponCode?: string
  affiliateCode?: string
  notes?: string
  adminNotes?: string
  createdAt: string
  updatedAt: string
}

export interface OrdersResponse {
  data: Order[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CreateOrderPayload {
  items: { productId: string; quantity: number; variant?: string }[]
  shippingAddress: Address
  paymentMethod: string
  couponCode?: string
  affiliateCode?: string
  notes?: string
}

export interface OrderFilters {
  page?: number
  limit?: number
  status?: OrderStatus | string
  paymentStatus?: PaymentStatus
  search?: string
  userId?: string
  dateFrom?: string
  dateTo?: string
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const orderService = {
  // ── Customer ──────────────────────────────────────────────────────────────

  /** Current user's orders */
  getMyOrders: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get<OrdersResponse>('/orders/me', params),

  /** Single order (customer) */
  getMyOrderById: (id: string) =>
    api.get<Order>(`/orders/me/${id}`),

  /** Place an order */
  create: (payload: CreateOrderPayload) =>
    api.post<Order>('/orders', payload),

  /** Customer cancels an order */
  cancel: (id: string, reason?: string) =>
    api.patch<Order>(`/orders/${id}/cancel`, { reason }),

  // ── Admin ──────────────────────────────────────────────────────────────────

  /** [Admin] All orders with filters */
  getAll: (params?: OrderFilters) =>
    api.get<OrdersResponse>('/admin/orders', params),

  /** [Admin] Single order */
  getById: (id: string) =>
    api.get<Order>(`/admin/orders/${id}`),

  /** [Admin] Update order status */
  updateStatus: (id: string, status: OrderStatus) =>
    api.patch<Order>(`/admin/orders/${id}/status`, { status }),

  /** [Admin] Update payment status */
  updatePaymentStatus: (id: string, paymentStatus: PaymentStatus) =>
    api.patch<Order>(`/admin/orders/${id}/payment-status`, { paymentStatus }),

  /** [Admin] Add tracking info */
  addTracking: (id: string, trackingNumber: string, trackingUrl?: string) =>
    api.patch<Order>(`/admin/orders/${id}/tracking`, { trackingNumber, trackingUrl }),

  /** [Admin] Add admin notes */
  addAdminNote: (id: string, note: string) =>
    api.patch<Order>(`/admin/orders/${id}/notes`, { note }),

  /** [Admin] Order revenue stats */
  getStats: (params?: { from?: string; to?: string }) =>
    api.get<{
      totalRevenue: number
      totalOrders: number
      avgOrderValue: number
      byStatus: Record<OrderStatus, number>
      revenueByDay: { date: string; revenue: number; orders: number }[]
    }>('/admin/orders/stats', params),

  /** [Admin] Export orders as CSV */
  exportCsv: (params?: OrderFilters) =>
    api.get<Blob>('/admin/orders/export', params),
}
