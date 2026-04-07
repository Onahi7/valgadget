import { api } from '@/lib/api-client'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AffiliateStats {
  affiliateCode: string
  totalClicks: number
  totalConversions: number
  conversionRate: number          // 0–1
  totalEarnings: number
  pendingEarnings: number
  paidEarnings: number
  thisMonthClicks: number
  thisMonthConversions: number
  thisMonthEarnings: number
  commissionRate: number          // 0–1 (e.g. 0.1 = 10%)
  lifetimeOrders: number
}

export interface AffiliateClick {
  id: string
  affiliateCode: string
  referrer?: string
  userAgent?: string
  country?: string
  converted: boolean
  orderId?: string
  orderValue?: number
  commission?: number
  createdAt: string
}

export interface AffiliatePayout {
  id: string
  affiliateId: string
  amount: number
  currency: string
  status: 'pending' | 'processing' | 'paid' | 'rejected'
  method: string
  accountDetails?: string        // e.g. bank/PayPal
  reference?: string
  notes?: string
  requestedAt: string
  processedAt?: string
}

export interface AffiliateLink {
  url: string
  code: string
  productSlug?: string
  clicks: number
  conversions: number
  createdAt: string
}

export interface RequestPayoutPayload {
  amount: number
  method: string
  accountDetails?: string
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const affiliateService = {
  // ── Affiliate dashboard ────────────────────────────────────────────────────

  /** Dashboard stats */
  getStats: () =>
    api.get<AffiliateStats>('/affiliate/stats'),

  /** Click history with pagination */
  getClicks: (params?: { page?: number; limit?: number; converted?: boolean }) =>
    api.get<{ data: AffiliateClick[]; total: number; page: number; totalPages: number }>(
      '/affiliate/clicks',
      params
    ),

  /** Payout history */
  getPayouts: (params?: { page?: number; limit?: number }) =>
    api.get<{ data: AffiliatePayout[]; total: number }>('/affiliate/payouts', params),

  /** Request a payout */
  requestPayout: (payload: RequestPayoutPayload) =>
    api.post<AffiliatePayout>('/affiliate/payouts', payload),

  /** Generate a trackable link (optionally scoped to a product) */
  generateLink: (productSlug?: string) =>
    api.post<AffiliateLink>('/affiliate/links', { productSlug }),

  /** All generated links */
  getLinks: () =>
    api.get<AffiliateLink[]>('/affiliate/links'),

  /** Revenue chart data */
  getRevenueChart: (params?: { period?: 'week' | 'month' | 'year' }) =>
    api.get<{ date: string; clicks: number; conversions: number; earnings: number }[]>(
      '/affiliate/revenue-chart',
      params
    ),

  // ── Admin ──────────────────────────────────────────────────────────────────

  /** [Admin] All affiliates */
  adminGetAll: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get<{ data: AffiliateStats[]; total: number }>('/admin/affiliates', params),

  /** [Admin] Pending payout requests */
  adminGetPayouts: (params?: { status?: AffiliatePayout['status'] }) =>
    api.get<{ data: AffiliatePayout[]; total: number }>('/admin/affiliates/payouts', params),

  /** [Admin] Approve or reject a payout */
  adminProcessPayout: (
    id: string,
    status: 'processing' | 'paid' | 'rejected',
    reference?: string,
    notes?: string
  ) =>
    api.patch<AffiliatePayout>(`/admin/affiliates/payouts/${id}`, { status, reference, notes }),

  /** [Admin] Adjust commission rate */
  adminSetCommission: (affiliateId: string, commissionRate: number) =>
    api.patch<{ message: string }>(`/admin/affiliates/${affiliateId}/commission`, { commissionRate }),

  /** [Admin] Aggregate affiliate stats */
  adminGetStats: () =>
    api.get<{
      totalAffiliates: number
      totalRevenue: number
      totalPaidOut: number
      pendingPayouts: number
    }>('/admin/affiliates/stats'),
}
