'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Package, ChevronRight, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Empty } from '@/components/ui/empty'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { orderService, type Order } from '@/lib/services/order.service'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  processing: 'bg-blue-100 text-blue-700 border-blue-200',
  shipped: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  delivered: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
  refunded: 'bg-gray-100 text-gray-600 border-gray-200',
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    orderService.getMyOrders()
      .then(r => setOrders(r.data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = orders.filter(o =>
    o.reference.toLowerCase().includes(search.toLowerCase()) ||
    o.items.some(i => i.product.name.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-page-reveal">
        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">My Orders</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Empty
            title={search ? 'No orders match your search' : 'No orders yet'}
            description={search ? 'Try a different search term.' : 'Start shopping to see your orders here.'}
            action={!search ? <Button asChild><Link href="/shop"><Package className="w-4 h-4 mr-2" /> Shop Now</Link></Button> : undefined}
          />
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map(order => (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="group flex flex-col sm:flex-row gap-4 bg-card border border-border rounded-xl p-5 hover:border-primary/40 hover:shadow-sm transition-all"
              >
                {/* Thumbnail grid */}
                <div className="flex gap-2 shrink-0">
                  {order.items.slice(0, 3).map(item => (
                    <div key={item.id} className="w-14 h-14 rounded-lg overflow-hidden bg-surface border border-border">
                      <Image src={item.product.images[0]} alt={item.product.name} width={56} height={56} className="object-cover w-full h-full" unoptimized />
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <div className="w-14 h-14 rounded-lg bg-muted border border-border flex items-center justify-center text-xs font-bold text-muted-foreground">
                      +{order.items.length - 3}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <p className="font-bold font-mono text-sm text-foreground">{order.reference}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <Badge className={`text-xs border font-medium capitalize ${STATUS_COLORS[order.status] ?? ''}`}>
                      {order.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 truncate">
                    {order.items.map(i => i.product.name).join(', ')}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="font-bold text-foreground">₦{order.total.toLocaleString()}</span>
                    <span className="text-xs text-primary font-medium group-hover:underline flex items-center gap-1">
                      View details <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
