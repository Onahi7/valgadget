'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ShoppingBag, ShoppingCart, Users, DollarSign, ArrowUpRight, Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { adminService, type DashboardStats, type RecentOrder, type TopProduct, type RevenueChartData } from '@/lib/services/admin.service'
import { ORDER_STATUS_COLORS } from '@/lib/constants/admin-status-colors'

export function AdminDashboardClient() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentOrders, setOrders] = useState<RecentOrder[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [chartData, setChartData] = useState<RevenueChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    Promise.all([
      adminService.getDashboardStats(),
      adminService.getRecentOrders(5),
      adminService.getTopProducts(5),
      adminService.getRevenueChart({ days: 14 }),
    ])
      .then(([nextStats, nextOrders, nextTopProducts, nextChart]) => {
        if (!mounted) return
        setStats(nextStats)
        setOrders(nextOrders)
        setTopProducts(nextTopProducts)
        setChartData(nextChart)
        setLoadError(null)
      })
      .catch(() => {
        if (!mounted) return
        setLoadError('Unable to load dashboard data. Refresh or check the admin API.')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  const formatNaira = (value: number) => `₦${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`

  const revenueTotal = stats?.revenue.total ?? 0
  const ordersTotal = stats?.orders.total ?? 0
  const ordersPending = stats?.orders.pending ?? 0
  const customersTotal = stats?.customers.total ?? 0
  const affiliatesTotal = stats?.affiliates.total ?? 0
  const productsTotal = stats?.products.total ?? 0

  const statCards = [
    { label: 'Total Revenue', value: formatNaira(revenueTotal), sub: `${ordersPending} pending`, icon: DollarSign, color: 'bg-green-50 text-green-600 dark:bg-green-950' },
    { label: 'Orders', value: ordersTotal.toLocaleString(), sub: `${ordersPending} pending`, icon: ShoppingCart, color: 'bg-blue-50 text-blue-600 dark:bg-blue-950' },
    { label: 'Customers', value: customersTotal.toLocaleString(), sub: `${affiliatesTotal} affiliates`, icon: Users, color: 'bg-violet-50 text-violet-600 dark:bg-violet-950' },
    { label: 'Products', value: productsTotal.toLocaleString(), sub: `${stats?.products.active ?? 0} active`, icon: ShoppingBag, color: 'bg-amber-50 text-amber-600 dark:bg-amber-950' },
  ]

  return (
    <div className="space-y-6 animate-page-reveal">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Store performance, recent orders, and catalog health at a glance.</p>
      </div>

      {loadError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {loadError}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="rounded-lg border border-border bg-card p-5">
            <div className="mb-4 flex items-start justify-between">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <p className="font-mono text-2xl font-bold">{loading ? '...' : value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {label} • <span className="text-foreground/70">{sub}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold">Revenue (Last 14 Days)</h2>
          <span className="text-xs text-muted-foreground">
            {chartData.reduce((s, d) => s + d.orders, 0)} orders
          </span>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading chart...</p>
        ) : chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground">No revenue data yet.</p>
        ) : (
          <div className="flex items-end gap-1.5 h-40">
            {chartData.map(d => {
              const maxRev = Math.max(...chartData.map(x => x.revenue), 1)
              const pct = (d.revenue / maxRev) * 100
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="relative w-full flex justify-center">
                    <span className="absolute -top-5 text-[9px] font-mono text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {formatNaira(d.revenue)}
                    </span>
                  </div>
                  <div
                    className="w-full rounded-t bg-primary/80 hover:bg-primary transition-colors min-h-[2px]"
                    style={{ height: `${Math.max(pct, 2)}%` }}
                  />
                  <span className="text-[8px] text-muted-foreground truncate w-full text-center">
                    {new Date(d.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-6 lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-bold">Order Overview</h2>
            <span className="text-xs text-muted-foreground">{ordersTotal} total orders</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Pending', count: ordersPending, color: 'bg-amber-500' },
              { label: 'Processing', count: stats?.orders.processing ?? 0, color: 'bg-blue-500' },
              { label: 'Total', count: ordersTotal, color: 'bg-primary' },
              { label: 'Revenue', count: null, value: formatNaira(revenueTotal), color: 'bg-green-500' },
              { label: 'Products', count: productsTotal, color: 'bg-orange-500' },
              { label: 'Affiliates', count: affiliatesTotal, color: 'bg-violet-500' },
            ].map(item => (
              <div key={item.label} className="rounded-lg bg-muted/40 p-3 text-center">
                <div className={`mx-auto mb-2 h-2 w-2 rounded-full ${item.color}`} />
                <p className="font-mono text-lg font-bold">{loading ? '...' : item.value ?? item.count ?? 0}</p>
                <p className="text-[10px] text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">Top Products</h2>
            <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
              <Link href="/admin/products">
                View all <ArrowUpRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
          <div className="flex flex-col gap-3">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading product signals...</p>
            ) : topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No paid product data yet.</p>
            ) : topProducts.map((product, index) => (
              <div key={product.id} className="flex items-center gap-3">
                <span className="w-4 shrink-0 font-mono text-xs text-muted-foreground">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.totalSold} sold</p>
                </div>
                <span className="shrink-0 text-sm font-bold">{formatNaira(product.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-bold">Recent Orders</h2>
          <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
            <Link href="/admin/orders">
              View all <ArrowUpRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="px-6 py-3 text-left font-medium">Reference</th>
                <th className="px-4 py-3 text-left font-medium">Customer</th>
                <th className="px-4 py-3 text-left font-medium">Items</th>
                <th className="px-4 py-3 text-left font-medium">Total</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">Loading recent orders...</td>
                </tr>
              ) : recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">No orders yet</td>
                </tr>
              ) : recentOrders.map(order => (
                <tr key={order.id} className="border-b border-border/50 transition-colors hover:bg-accent/30">
                  <td className="px-6 py-3">
                    <Link href={`/admin/orders/${order.id}`} className="font-mono text-xs text-primary hover:underline">
                      {order.reference}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{order.customer?.name ?? '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Package className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{order.itemCount ?? 0}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-bold">{formatNaira(Number(order.total))}</td>
                  <td className="px-4 py-3">
                    <Badge className={`border text-[11px] font-medium capitalize ${ORDER_STATUS_COLORS[order.status] ?? ''}`}>
                      {order.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
