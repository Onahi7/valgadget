'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ShoppingBag, ShoppingCart, Users, DollarSign, ArrowUpRight, Package, RefreshCw } from 'lucide-react'
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
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let mounted = true
    setLoading(true)

    Promise.allSettled([
      adminService.getDashboardStats(),
      adminService.getRecentOrders(5),
      adminService.getTopProducts(5),
      adminService.getRevenueChart({ days: 14 }),
    ])
      .then(([statsRes, ordersRes, topRes, chartRes]) => {
        if (!mounted) return
        if (statsRes.status === 'fulfilled') setStats(statsRes.value)
        if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value)
        if (topRes.status === 'fulfilled') setTopProducts(topRes.value)
        if (chartRes.status === 'fulfilled') setChartData(chartRes.value)
        const anyFailed = [statsRes, ordersRes, topRes, chartRes].some(r => r.status === 'rejected')
        setLoadError(anyFailed ? 'Some dashboard data failed to load. Refresh or check the admin API.' : null)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [reloadKey])

  const formatNaira = (value: number) => `₦${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`

  const revenueTotal = stats?.revenue.total ?? 0
  const ordersTotal = stats?.orders.total ?? 0
  const ordersPending = stats?.orders.pending ?? 0
  const customersTotal = stats?.customers.total ?? 0
  const affiliatesTotal = stats?.affiliates.total ?? 0
  const productsTotal = stats?.products.total ?? 0
  const maxChartRevenue = Math.max(...chartData.map(item => item.revenue), 1)

  const statCards = [
    { label: 'Total Revenue', value: formatNaira(revenueTotal), sub: `${formatNaira(stats?.revenue.today ?? 0)} today`, icon: DollarSign, color: 'bg-green-50 text-green-600 dark:bg-green-950' },
    { label: 'Orders', value: ordersTotal.toLocaleString(), sub: `${ordersPending} pending · ${stats?.orders.today ?? 0} today`, icon: ShoppingCart, color: 'bg-blue-50 text-blue-600 dark:bg-blue-950' },
    { label: 'Customers', value: customersTotal.toLocaleString(), sub: `+${stats?.customers.newThisMonth ?? 0} this month`, icon: Users, color: 'bg-violet-50 text-violet-600 dark:bg-violet-950' },
    { label: 'Products', value: productsTotal.toLocaleString(), sub: (stats?.products.lowStock ?? 0) > 0 ? `${stats?.products.lowStock} low stock` : `${stats?.products.active ?? 0} active`, icon: ShoppingBag, color: 'bg-amber-50 text-amber-600 dark:bg-amber-950' },
  ]

  return (
    <div className="animate-page-reveal space-y-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.03em]">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Store performance, recent orders, and catalog health at a glance.</p>
      </div>

      {loadError && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <span>{loadError}</span>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 gap-1.5"
            onClick={() => setReloadKey(k => k + 1)}
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {statCards.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="group min-w-0 rounded-xl border border-[#e0e5e0] bg-white p-4 shadow-[0_1px_2px_rgba(31,36,33,0.03)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-[#cbd5cb] hover:shadow-[0_8px_24px_rgba(31,36,33,0.06)] sm:p-5">
            <div className="mb-3 flex items-start justify-between">
              <div className={`flex h-9 w-9 items-center justify-center rounded-[10px] sm:h-10 sm:w-10 ${color}`}>
                <Icon className="h-[18px] w-[18px] sm:h-5 sm:w-5" strokeWidth={2} />
              </div>
            </div>
            <p className="font-display text-2xl font-semibold tabular-nums tracking-[-0.04em] sm:text-[28px]">{loading ? '...' : value}</p>
            <p className="mt-1 truncate text-[11px] font-medium text-foreground/80 sm:text-xs">{label}</p>
            <p className="mt-0.5 truncate text-[10px] text-muted-foreground sm:text-[11px]">
              {sub}
            </p>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="rounded-xl border border-[#e0e5e0] bg-white p-5 shadow-[0_1px_2px_rgba(31,36,33,0.03)] sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold">Revenue <span className="font-normal text-muted-foreground">(Last 14 Days)</span></h2>
          <span className="text-xs text-muted-foreground">
            {chartData.reduce((s, d) => s + d.orders, 0)} orders
          </span>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading chart...</p>
        ) : chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground">No revenue data yet.</p>
        ) : (
          <div className="relative flex h-36 items-stretch gap-1.5 border-b border-[#dfe5df] pb-4 sm:h-44 sm:pb-0" role="group" aria-label="Revenue by day for the last 14 days">
            <span className="pointer-events-none absolute inset-x-0 top-1/4 border-t border-dashed border-[#e6eae6]" />
            <span className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-[#e6eae6]" />
            <span className="pointer-events-none absolute inset-x-0 top-3/4 border-t border-dashed border-[#e6eae6]" />
            {chartData.map(d => {
              const pct = (d.revenue / maxChartRevenue) * 100
              return (
                <div key={d.date} className="group min-w-0 flex-1 flex flex-col">
                  <div className="flex flex-1 items-end">
                    <div
                      className="relative z-[1] w-full rounded-t-sm bg-primary/85 transition-colors hover:bg-primary focus:bg-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                      style={{ height: `${Math.max(pct, 2)}%` }}
                      tabIndex={0}
                      aria-label={`${new Date(d.date).toLocaleDateString()}: ${formatNaira(d.revenue)} revenue from ${d.orders} orders`}
                    >
                      <span className="pointer-events-none absolute -top-7 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded border border-border bg-popover px-1.5 py-0.5 font-mono text-[9px] text-popover-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                        {formatNaira(d.revenue)} · {d.orders} orders
                      </span>
                    </div>
                  </div>
                  <span className="mt-1 hidden w-full truncate text-center text-[8px] text-muted-foreground sm:block">
                    {new Date(d.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              )
            })}
            <div className="absolute inset-x-0 bottom-0 flex justify-between text-[8px] text-muted-foreground sm:hidden" aria-hidden="true">
              {[chartData[0], chartData[4], chartData[8], chartData.at(-1)].map(item => item ? (
                <span key={item.date}>{new Date(item.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
              ) : null)}
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-[#e0e5e0] bg-white p-5 shadow-[0_1px_2px_rgba(31,36,33,0.03)] lg:col-span-2 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold">Order Overview</h2>
            <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
              <Link href="/admin/orders">
                View all <ArrowUpRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {[
              { label: 'Pending', count: ordersPending, color: 'bg-amber-500' },
              { label: 'Processing', count: stats?.orders.processing ?? 0, color: 'bg-blue-500' },
              { label: 'Shipped', count: stats?.orders.shipped ?? 0, color: 'bg-indigo-500' },
              { label: 'Delivered', count: stats?.orders.delivered ?? 0, color: 'bg-green-500' },
              { label: 'Cancelled', count: stats?.orders.cancelled ?? 0, color: 'bg-red-500' },
              { label: 'Total', count: ordersTotal, color: 'bg-primary' },
            ].map(item => (
              <div key={item.label} className="rounded-lg border border-[#e7ebe7] bg-[#f7f8f7] px-2 py-3 text-center">
                <div className={`mx-auto mb-2 h-1.5 w-1.5 rounded-full ${item.color}`} />
                <p className="font-display text-lg font-semibold tabular-nums">{loading ? '...' : (item.count ?? 0).toLocaleString()}</p>
                <p className="mt-0.5 truncate text-[9px] text-muted-foreground sm:text-[10px]">{item.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            {loading ? 'Loading…' : `${stats?.orders.today ?? 0} orders placed today · ${affiliatesTotal} affiliates registered`}
          </p>
        </div>

        <div className="rounded-xl border border-[#e0e5e0] bg-white p-5 shadow-[0_1px_2px_rgba(31,36,33,0.03)] sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold">Top Products</h2>
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

      <div className="overflow-hidden rounded-xl border border-[#e0e5e0] bg-white shadow-[0_1px_2px_rgba(31,36,33,0.03)]">
        <div className="flex items-center justify-between border-b border-[#e7ebe7] px-5 py-4 sm:px-6">
          <h2 className="text-[15px] font-semibold">Recent Orders</h2>
          <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
            <Link href="/admin/orders">
              View all <ArrowUpRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </div>
        <div className="hidden overflow-x-auto md:block">
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
                <tr key={order.id} className="border-b border-[#edf0ed] transition-colors last:border-0 hover:bg-[#f7f8f7]">
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
        <div className="divide-y divide-[#edf0ed] md:hidden">
          {loading ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">Loading recent orders...</p>
          ) : recentOrders.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">No orders yet</p>
          ) : recentOrders.map(order => (
            <Link key={order.id} href={`/admin/orders/${order.id}`} className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-[#f7f8f7]">
              <div className="min-w-0">
                <p className="truncate font-mono text-xs font-bold text-primary">{order.reference}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">{order.customer?.name ?? 'Guest customer'} · {order.itemCount ?? 0} item{order.itemCount === 1 ? '' : 's'}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold">{formatNaira(Number(order.total))}</p>
                <Badge className={`mt-1 border text-[10px] font-medium capitalize ${ORDER_STATUS_COLORS[order.status] ?? ''}`}>
                  {order.status}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
