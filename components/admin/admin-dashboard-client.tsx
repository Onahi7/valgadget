'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ShoppingBag, ShoppingCart, Users, DollarSign, ArrowUpRight, Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getToken } from '@/lib/api-client'

type Stats = {
  users: number
  orders: number
  revenue: number
  products: number
  pendingOrders: number
  confirmedOrders: number
  lowStock: number
  affiliates: number
}

type Order = {
  id: string
  reference: string
  total: number
  status: string
  paymentStatus: string
  createdAt: string
  shippingAddress?: { fullName?: string }
  items?: unknown[]
}

type Product = {
  id: string
  name: string
  price: number
  reviewCount: number
  images: string[]
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  confirmed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  processing: 'bg-blue-100 text-blue-700 border-blue-200',
  shipped: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  delivered: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
}

export function AdminDashboardClient() {
  const [stats, setStats] = useState<Stats>({
    users: 0,
    orders: 0,
    revenue: 0,
    products: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
    lowStock: 0,
    affiliates: 0,
  })
  const [recentOrders, setOrders] = useState<Order[]>([])
  const [topProducts, setTopProducts] = useState<Product[]>([])

  useEffect(() => {
    fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json())
      .then(d => {
        if (d.users || d.orders || d.products) {
          setStats({
            users: d.users?.total ?? 0,
            orders: d.orders?.total ?? 0,
            revenue: d.orders?.revenue ?? 0,
            products: d.products?.total ?? 0,
            pendingOrders: d.orders?.pending ?? 0,
            confirmedOrders: d.orders?.confirmed ?? 0,
            lowStock: d.products?.lowStock ?? 0,
            affiliates: d.users?.affiliates ?? 0,
          })
        }
      })
      .catch(() => console.error('Failed to fetch dashboard stats'))

    fetch('/api/admin/orders?limit=5&page=1', { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d.data)) setOrders(d.data)
      })
      .catch(() => console.error('Failed to fetch recent orders'))

    fetch('/api/products?limit=5&sort=rating')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d.data)) setTopProducts(d.data)
      })
      .catch(() => console.error('Failed to fetch top products'))
  }, [])

  const formatNaira = (value: number) => `NGN ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`

  const statCards = [
    { label: 'Total Revenue', value: formatNaira(stats.revenue), sub: `${stats.confirmedOrders} confirmed`, icon: DollarSign, color: 'bg-green-50 text-green-600 dark:bg-green-950' },
    { label: 'Orders', value: stats.orders.toLocaleString(), sub: `${stats.pendingOrders} pending`, icon: ShoppingCart, color: 'bg-blue-50 text-blue-600 dark:bg-blue-950' },
    { label: 'Customers', value: stats.users.toLocaleString(), sub: `${stats.affiliates} affiliates`, icon: Users, color: 'bg-violet-50 text-violet-600 dark:bg-violet-950' },
    { label: 'Products', value: stats.products.toLocaleString(), sub: `${stats.lowStock} low stock`, icon: ShoppingBag, color: 'bg-amber-50 text-amber-600 dark:bg-amber-950' },
  ]

  return (
    <div className="space-y-6 animate-page-reveal">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Store performance, recent orders, and catalog health at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="rounded-lg border border-border bg-card p-5">
            <div className="mb-4 flex items-start justify-between">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <p className="font-mono text-2xl font-bold">{value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {label} • <span className="text-foreground/70">{sub}</span>
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-6 lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-bold">Order Overview</h2>
            <span className="text-xs text-muted-foreground">{stats.orders} total orders</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Pending', count: stats.pendingOrders, color: 'bg-amber-500' },
              { label: 'Confirmed', count: stats.confirmedOrders, color: 'bg-emerald-500' },
              { label: 'Total', count: stats.orders, color: 'bg-primary' },
              { label: 'Revenue', count: null, value: formatNaira(stats.revenue), color: 'bg-green-500' },
              { label: 'Low Stock', count: stats.lowStock, color: 'bg-red-500' },
              { label: 'Affiliates', count: stats.affiliates, color: 'bg-violet-500' },
            ].map(item => (
              <div key={item.label} className="rounded-lg bg-muted/40 p-3 text-center">
                <div className={`mx-auto mb-2 h-2 w-2 rounded-full ${item.color}`} />
                <p className="font-mono text-lg font-bold">{item.value ?? item.count ?? 0}</p>
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
            {topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No product data yet.</p>
            ) : topProducts.map((product, index) => (
              <div key={product.id} className="flex items-center gap-3">
                <span className="w-4 shrink-0 font-mono text-xs text-muted-foreground">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.reviewCount} reviews</p>
                </div>
                <span className="shrink-0 text-sm font-bold">{formatNaira(product.price)}</span>
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
              {recentOrders.length === 0 ? (
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
                  <td className="px-4 py-3 text-muted-foreground">{order.shippingAddress?.fullName ?? '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Package className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{order.items?.length ?? 0}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-bold">{formatNaira(Number(order.total))}</td>
                  <td className="px-4 py-3">
                    <Badge className={`border text-[11px] font-medium capitalize ${STATUS_COLORS[order.status] ?? ''}`}>
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
