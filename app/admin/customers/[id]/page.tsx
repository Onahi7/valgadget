'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail, Phone, Shield, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getToken } from '@/lib/api-client'
import { cn } from '@/lib/utils'

const ROLE_COLORS: Record<string, string> = {
  customer:  'bg-blue-100 text-blue-700 border-blue-200',
  affiliate: 'bg-primary/10 text-primary border-primary/20',
  admin:     'bg-purple-100 text-purple-700 border-purple-200',
}

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700', processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-indigo-100 text-indigo-700', delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

type Customer = { id: string; name: string; email: string; phone?: string; role: string; isVerified: boolean; createdAt: string; orders: number; spent: number }
type Order = { id: string; reference: string; total: number; status: string; createdAt: string }

export default function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [customer, setCustomer]       = useState<Customer | null>(null)
  const [customerOrders, setOrders]   = useState<Order[]>([])
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    const headers = { Authorization: `Bearer ${getToken()}` }
    Promise.all([
      fetch(`/api/admin/users/${id}`, { headers }).then(r => r.json()),
      fetch(`/api/admin/orders?userId=${id}&limit=20`, { headers }).then(r => r.json()),
    ]).then(([userRes, ordersRes]) => {
      if (userRes.data) setCustomer(userRes.data)
      if (ordersRes.data?.data) setOrders(ordersRes.data.data)
    }).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="py-20 text-center text-muted-foreground text-sm">Loading...</div>

  if (!customer) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground mb-4">Customer not found</p>
        <Button asChild variant="outline"><Link href="/admin/customers"><ArrowLeft className="w-4 h-4 mr-2" />Back</Link></Button>
      </div>
    )
  }

  const totalSpent = customerOrders.reduce((s, o) => s + Number(o.total), 0)

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/customers"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <h1 className="text-xl font-bold">Customer Profile</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile card */}
        <div className="bg-card border border-border rounded-lg p-6 flex flex-col items-center text-center gap-3">
          <Avatar className="w-16 h-16">
            <AvatarFallback className="text-lg bg-primary/10 text-primary font-bold">
              {customer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-bold text-lg">{customer.name}</p>
            <Badge className={cn('text-[11px] border capitalize mt-1', ROLE_COLORS[customer.role] ?? '')}>{customer.role}</Badge>
          </div>
          <div className="w-full text-sm space-y-2 pt-2 border-t border-border">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="w-4 h-4 shrink-0" /><span className="truncate">{customer.email}</span>
            </div>
            {customer.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-4 h-4 shrink-0" /><span>{customer.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="w-4 h-4 shrink-0 text-green-600" />
              <span>{customer.isVerified ? 'Verified' : 'Unverified'}</span>
            </div>
          </div>
          <div className="w-full pt-2 border-t border-border text-xs text-muted-foreground">
            Member since {new Date(customer.createdAt).toLocaleDateString()}
          </div>
        </div>

        {/* Stats */}
        <div className="md:col-span-2 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total Orders', value: customerOrders.length },
              { label: 'Total Spent', value: `₦${totalSpent.toLocaleString()}` },
              { label: 'Avg Order', value: customerOrders.length ? `₦${Math.round(totalSpent / customerOrders.length).toLocaleString()}` : '₦0' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-card border border-border rounded-lg p-4 text-center">
                <p className="text-xl font-bold font-mono">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Orders */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-bold text-sm">Recent Orders</h2>
            </div>
            {customerOrders.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground">No orders yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground border-b border-border bg-muted/20">
                    <th className="text-left px-5 py-2.5 font-medium">Reference</th>
                    <th className="text-left px-4 py-2.5 font-medium">Total</th>
                    <th className="text-left px-4 py-2.5 font-medium">Status</th>
                    <th className="text-left px-4 py-2.5 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {customerOrders.map(order => (
                    <tr key={order.id} className="border-b border-border/40 hover:bg-accent/20">
                      <td className="px-5 py-3">
                        <Link href={`/admin/orders/${order.id}`} className="font-mono text-xs text-primary hover:underline">{order.reference}</Link>
                      </td>
                      <td className="px-4 py-3 font-bold">₦{Number(order.total).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={cn('text-[11px] px-2 py-0.5 rounded-full font-medium capitalize', ORDER_STATUS_COLORS[order.status] ?? '')}>{order.status}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
