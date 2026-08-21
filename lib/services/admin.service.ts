import { api } from '@/lib/api-client'
import type { StoreSettings } from '@/lib/store-settings'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DashboardStats {
  revenue: {
    total: number
    today: number
    thisMonth: number
    lastMonth: number
    growthPercent: number
  }
  orders: {
    total: number
    today: number
    pending: number
    processing: number
    shipped: number
    delivered: number
    cancelled: number
  }
  customers: {
    total: number
    newThisMonth: number
    active: number
  }
  products: {
    total: number
    active: number
    lowStock: number
    outOfStock: number
  }
  affiliates: {
    total: number
    pendingPayouts: number
    pendingAmount: number
  }
  raffles: {
    active: number
    totalRevenue: number
  }
}

export interface RevenueChartData {
  date: string
  revenue: number
  orders: number
  refunds: number
}

export interface TopProduct {
  id: string
  name: string
  slug: string
  images: string[]
  totalSold: number
  revenue: number
}

export interface RecentOrder {
  id: string
  reference: string
  customer: { name: string; email: string }
  total: number
  status: string
  paymentStatus: string
  createdAt: string
  itemCount?: number
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const adminService = {
  /** Full dashboard stats */
  getDashboardStats: () =>
    api.get<DashboardStats>('/admin/dashboard/stats'),

  /** Revenue chart (last N days) */
  getRevenueChart: (params?: { days?: number }) =>
    api.get<RevenueChartData[]>('/admin/dashboard/revenue-chart', params),

  /** Top-selling products */
  getTopProducts: (limit = 5) =>
    api.get<TopProduct[]>('/admin/dashboard/top-products', { limit }),

  /** Recent orders feed */
  getRecentOrders: (limit = 10) =>
    api.get<RecentOrder[]>('/admin/dashboard/recent-orders', { limit }),

  /** Site settings */
  getSettings: () =>
    api.get<StoreSettings>('/admin/settings'),

  /** Update site settings */
  updateSettings: (payload: Partial<StoreSettings>) =>
    api.put<{ updated: number; settings: StoreSettings }>('/admin/settings', { settings: payload }),

  /** Upload site asset (logo, favicon, banner) */
  uploadAsset: (type: 'logo' | 'favicon' | 'banner', formData: FormData) =>
    api.upload<{ url: string }>(`/admin/assets/${type}`, formData),

  /** Activity log */
  getActivityLog: (params?: { page?: number; limit?: number; type?: string }) =>
    api.get<{
      data: {
        id: string
        action: string
        entityType: string
        entityId: string | null
        userId: string | null
        userName: string
        details: string | null
        createdAt: string
      }[]
      total: number
      page: number
      limit: number
    }>('/admin/activity-log', params),
}
