'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ShoppingBag, ShoppingCart, Users, DollarSign, TrendingUp, ArrowUpRight, Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getToken } from '@/lib/api-client'

type Stats = { users: number; orders: number; revenue: number; products: number; }
type Order = { id: string; reference: string; total: number; status: string; createdAt: string; customerName?: string; itemCount?: number; }
type Product = { id: string; name: string; price: number; reviewCount: number; images: string[] }

const MONTHLY = [
  { month: 'Jul', revenue: 5200 },
  { month: 'Aug', revenue: 7100 },
  { month: 'Sep', revenue: 6400 },
  { month: 'Oct', revenue: 8900 },
  { month: 'Nov', revenue: 9200 },
  { month: 'Dec', revenue: 11419 },
]

const STATUS_COLORS: Record<string, string> = {
  pending:    'bg-amber-100 text-amber-700 border-amber-200',
  processing: 'bg-blue-100 text-blue-700 border-blue-200',
  shipped:    'bg-indigo-100 text-indigo-700 border-indigo-200',
  delivered:  'bg-green-100 text-green-700 border-green-200',
  cancelled:  'bg-red-100 text-red-700 border-red-200',
}

const maxRevenue = Math.max(...MONTHLY.map(m => m.revenue))

export function AdminDashboardClient() {
  const [stats, setStats]         = useState<Stats>({ users: 0, orders: 0, revenue: 0, products: 0 })
  const [recentOrders, setOrders] = useState<Order[]>([])
  const [topProducts, setTopProducts] = useState<Product[]>([])

  useEffect(() => {
    fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${getToken()}` } }).then(r => r.json()).then(d => {
      if (d.data) setStats({
        users: d.data.users?.total ?? 0,
        orders: d.data.orders?.total ?? 0,
        revenue: d.data.orders?.revenue ?? 0,
        products: d.data.products?.total ?? 0,
      })
    })
    fetch('/api/admin/orders?limit=5&page=1', { headers: { Authorization: `Bearer ${getToken()}` } }).then(r => r.json()).then(d => {
      if (d.data?.data) setOrders(d.data.data)
    })
    fetch('/api/products?limit=5&sort=rating').then(r => r.json()).then(d => {
      if (d.data?.data) setTopProducts(d.data.data)
    })
  }, [])

  const STAT_CARDS = [
    { label: 'Total Revenue', value: `₦${stats.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
 delta: '+12.5%', positive: true, icon: DollarSign, color: 'bg-green-50 text-green-600 dark:bg-green-950' },
    { label: 'Orders',        value: stats.orders.toLocaleString(),   delta: '+8.2%', positive: true, icon: ShoppingCart, color: 'bg-blue-50 text-blue-600 dark:bg-blue-950' },
    { label: 'Customers',     value: stats.users.toLocaleString(),    delta: '+5.1%', positive: true, icon: Users,        color: 'bg-violet-50 text-violet-600 dark:bg-violet-950' },
    { label: 'Products',      value: stats.products.toLocaleString(), delta: '+2',    positive: true, icon: ShoppingBag,  color: 'bg-amber-50 text-amber-600 dark:bg-amber-950' },
  ]

  return (
    <div className="space-y-6 animate-page-reveal">
      {/* Stat cards */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ label, value, delta, positive, icon: Icon, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${positive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                <TrendingUp className="w-3 h-3" />
                {delta}
              </div>
            </div>
            <p className="text-2xl font-bold font-mono">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold">Revenue Overview</h2>
            <span className="text-xs text-muted-foreground">Last 6 months</span>
          </div>
          <div className="flex items-end gap-3 h-44">
            {MONTHLY.map(({ month, revenue }) => (
              <div key={month} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[10px] text-muted-foreground font-mono tabular-nums">₦{(revenue / 1000).toFixed(1)}k</span>
                <div
                  className="w-full rounded-t-md bg-primary/80 hover:bg-primary transition-colors cursor-default"
                  style={{ height: `${(revenue / maxRevenue) * 100}%` }}
                  title={`₦${revenue.toLocaleString()}`}
                />
                <span className="text-[10px] text-muted-foreground">{month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top products */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">Top Products</h2>
            <Button variant="ghost" size="sm" asChild className="text-xs h-7">
              <Link href="/admin/products">View all <ArrowUpRight className="w-3 h-3 ml-1" /></Link>
            </Button>
          </div>
          <div className="flex flex-col gap-3">
            {topProducts.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground font-mono w-4 shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.reviewCount} reviews</p>
                </div>
                <span className="text-sm font-bold shrink-0">₦{p.price}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-card border border-border rounded-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-bold">Recent Orders</h2>
          <Button variant="ghost" size="sm" asChild className="text-xs h-7">
            <Link href="/admin/orders">View all <ArrowUpRight className="w-3 h-3 ml-1" /></Link>
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground border-b border-border">
                <th className="text-left px-6 py-3 font-medium">Reference</th>
                <th className="text-left px-4 py-3 font-medium">Customer</th>
                <th className="text-left px-4 py-3 font-medium">Items</th>
                <th className="text-left px-4 py-3 font-medium">Total</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">No orders yet</td></tr>
              ) : recentOrders.map(order => (
                <tr key={order.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                  <td className="px-6 py-3">
                    <Link href={`/admin/orders/${order.id}`} className="font-mono text-xs text-primary hover:underline">
                      {order.reference}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{order.customerName ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Package className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{order.itemCount ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-bold">₦{Number(order.total).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <Badge className={`text-[11px] border font-medium capitalize ${STATUS_COLORS[order.status] ?? ''}`}>
                      {order.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
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
