'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  User, Package, Heart, LayoutDashboard, ChevronRight,
  ShoppingBag, Star, Share2, Settings, Loader2, TrendingUp, MapPin,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { useAuth } from '@/contexts/auth-context'
import { useWishlist } from '@/contexts/wishlist-context'
import { orderService, type Order } from '@/lib/services/order.service'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-600',
}

const QUICK_LINKS = [
  { href: '/account/profile',   icon: User,        label: 'My Profile',   desc: 'Update name, email & password' },
  { href: '/account/orders',    icon: Package,     label: 'My Orders',    desc: 'View & track all orders' },
  { href: '/account/addresses', icon: MapPin,      label: 'Addresses',    desc: 'Manage delivery addresses' },
  { href: '/wishlist',          icon: Heart,       label: 'Wishlist',     desc: 'Your saved items' },
  { href: '/affiliate',         icon: Share2,      label: 'Affiliate',    desc: 'Earn by referring friends' },
]

function StatCard({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold leading-tight">{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  )
}

export default function AccountDashboardPage() {
  const { user } = useAuth()
  const { items: wishlistItems } = useWishlist()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    orderService.getMyOrders({ limit: 5 })
      .then(r => setOrders(r.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const totalSpent = orders.reduce((acc, o) => acc + o.total, 0)
  const firstName = user?.name?.split(' ')[0] ?? 'there'

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-page-reveal">

        {/* Welcome banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/70 p-6 text-white shadow-lg">
          <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/10" />
          <div className="absolute -right-2 -bottom-10 w-24 h-24 rounded-full bg-white/5" />
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div>
              <p className="text-white/70 text-sm mb-1">Welcome back</p>
              <h1 className="text-2xl sm:text-3xl font-bold">Hey, {firstName}! 👋</h1>
              <p className="text-white/80 text-sm mt-1">{user?.email}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 text-2xl font-bold uppercase">
              {firstName[0]}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
          <StatCard icon={ShoppingBag} label="Total Orders" value={orders.length} sub="all time" />
          <StatCard icon={TrendingUp} label="Total Spent" value={`₦${totalSpent.toLocaleString()}`} sub="confirmed orders" />
          <StatCard icon={Heart} label="Wishlist Items" value={wishlistItems.length} sub="saved for later" />
        </div>

        {/* Quick links */}
        <div>
          <h2 className="font-bold text-base mb-3 flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4 text-primary" /> Quick Access
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {QUICK_LINKS.map(({ href, icon: Icon, label, desc }) => (
              <Link key={href} href={href}
                className="group flex items-center gap-4 bg-card border border-border rounded-2xl p-4 hover:border-primary/40 hover:bg-primary/5 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-muted group-hover:bg-primary/10 flex items-center justify-center shrink-0 transition-colors">
                  <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent orders */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-base flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" /> Recent Orders
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/account/orders">View all</Link>
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />)}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-2xl">
              <ShoppingBag className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="font-semibold text-sm">No orders yet</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">Start shopping to see your orders here</p>
              <Button asChild size="sm">
                <Link href="/shop">Browse Products</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(order => (
                <Link key={order.id} href={`/account/orders/${order.id}`}
                  className="group flex items-center gap-4 bg-card border border-border rounded-2xl p-4 hover:border-primary/40 hover:bg-primary/5 transition-all"
                >
                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-xl bg-muted overflow-hidden shrink-0">
                    {order.items[0]?.product?.images?.[0] ? (
                      <Image
                        src={order.items[0].product.images[0]}
                        alt={order.items[0].product.name}
                        width={56} height={56}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-5 h-5 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs text-muted-foreground">{order.reference}</p>
                    <p className="font-semibold text-sm truncate">
                      {order.items[0]?.product?.name}
                      {order.items.length > 1 && <span className="text-muted-foreground"> +{order.items.length - 1}</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>

                  {/* Right side */}
                  <div className="text-right shrink-0">
                    <p className="font-bold text-sm">₦{order.total.toLocaleString()}</p>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium mt-1 capitalize ${STATUS_COLORS[order.status] ?? ''}`}>
                      {order.status}
                    </span>
                  </div>

                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 ml-1" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
