'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, ChevronDown, Download, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getToken } from '@/lib/api-client'
import { ORDER_STATUS_COLORS, PAYMENT_STATUS_COLORS } from '@/lib/constants/admin-status-colors'

const STATUS_OPTIONS = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']

type Order = {
  id: string; reference: string; total: number; status: string; paymentStatus: string;
  createdAt: string;
  shippingAddress?: { fullName?: string };
  items?: unknown[];
}

type OrdersResponse = {
  data: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary?: Record<string, number>;
}

export default function AdminOrdersPage() {
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatus] = useState('all')
  const [orders, setOrders]       = useState<Order[]>([])
  const [loading, setLoading]     = useState(true)
  const [page, setPage]           = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal]         = useState(0)
  const [summary, setSummary]     = useState<Record<string, number>>({})

  const PAGE_SIZE = 20

  const fetchOrders = (p: number) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p), limit: String(PAGE_SIZE) })
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (search) params.set('search', search)
    fetch(`/api/admin/orders?${params}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.json())
      .then((d: OrdersResponse) => {
        if (d.data) setOrders(d.data)
        if (d.totalPages) setTotalPages(d.totalPages)
        setTotal(d.total ?? 0)
        setSummary(d.summary ?? {})
        setPage(p)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchOrders(1)
  }, [search, statusFilter])

  const revenue = Number(summary.revenue ?? 0)

  const formatNaira = (value: number) => `₦${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`

  return (
    <div className="space-y-6 animate-page-reveal">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground">{total} orders · {formatNaira(revenue)} revenue</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto" onClick={() => {
          const params = new URLSearchParams()
          if (statusFilter !== 'all') params.set('status', statusFilter)
          if (search) params.set('search', search)
          window.open(`/api/admin/orders/export?${params}`, '_blank')
        }}>
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {STATUS_OPTIONS.filter(s => s !== 'all').map(status => {
          const count = Number(summary[status] ?? 0)
          return (
            <button
              key={status}
              onClick={() => setStatus(status)}
              className={cn(
                'bg-card border border-border rounded-lg px-3 py-2.5 text-center transition-all hover:border-primary/40',
                statusFilter === status && 'border-primary ring-1 ring-primary/20'
              )}
            >
              <p className="text-lg font-bold font-mono">{count}</p>
              <p className="text-[11px] text-muted-foreground capitalize">{status}</p>
            </button>
          )
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by reference or customer..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={e => setStatus(e.target.value)}
            className="appearance-none bg-card border border-border rounded-md pl-3 pr-8 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3 font-medium">Reference</th>
                <th className="text-left px-4 py-3 font-medium">Customer</th>
                <th className="text-left px-4 py-3 font-medium">Items</th>
                <th className="text-left px-4 py-3 font-medium">Total</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Payment</th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-right px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">Loading...</td></tr>
              ) : orders.map(order => (
                <tr key={order.id} className="border-b border-border/50 hover:bg-accent/20 transition-colors">
                  <td className="px-5 py-3">
                    <Link href={`/admin/orders/${order.id}`} className="font-mono text-xs text-primary hover:underline font-bold">
                      {order.reference}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{order.shippingAddress?.fullName || '-'}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{order.items?.length ?? 0} item{(order.items?.length ?? 0) !== 1 ? 's' : ''}</td>
                  <td className="px-4 py-3 font-bold">{formatNaira(Number(order.total))}</td>
                  <td className="px-4 py-3">
                    <Badge className={cn('text-[11px] border capitalize', ORDER_STATUS_COLORS[order.status])}>{order.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={cn('text-[11px] border capitalize', PAYMENT_STATUS_COLORS[order.paymentStatus])}>{order.paymentStatus}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                      <Link href={`/admin/orders/${order.id}`} aria-label="View order"><Eye className="w-3.5 h-3.5" /></Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && orders.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">No orders match your filters.</div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Page {page} of {totalPages} ({total} total)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchOrders(page - 1)}
                disabled={page <= 1}
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchOrders(page + 1)}
                disabled={page >= totalPages}
              >
                Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
