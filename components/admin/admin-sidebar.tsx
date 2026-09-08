'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ShoppingBag, ShoppingCart, Users, Tag, Ticket,
  Share2, Settings, ChevronRight, Store, MessageCircle, Truck,
  Star, Percent, Activity, Mail,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { href: '/admin/products',   label: 'Products',    icon: ShoppingBag },
      { href: '/admin/categories', label: 'Categories',  icon: Tag },
      { href: '/admin/raffles',    label: 'Raffles',     icon: Ticket },
    ],
  },
  {
    label: 'Sales',
    items: [
      { href: '/admin/orders',    label: 'Orders',     icon: ShoppingCart },
      { href: '/admin/customers', label: 'Customers',  icon: Users },
      { href: '/admin/affiliate', label: 'Affiliates', icon: Share2 },
      { href: '/admin/chat',      label: 'Live Chat',  icon: MessageCircle },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/admin/shipping', label: 'Shipping Rates', icon: Truck },
      { href: '/admin/settings', label: 'Settings', icon: Settings },
      { href: '/admin/email-templates', label: 'Email Templates', icon: Mail },
      { href: '/admin/reviews', label: 'Reviews', icon: Star },
      { href: '/admin/coupons', label: 'Coupons', icon: Percent },
      { href: '/admin/activity-log', label: 'Activity Log', icon: Activity },
    ],
  },
]

export function AdminNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  const isActive = (item: { href: string; exact?: boolean }) => {
    if (item.exact) return pathname === item.href
    return pathname.startsWith(item.href)
  }

  return (
    <>
      {NAV_GROUPS.map(group => (
        <div key={group.label}>
          <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
            {group.label}
          </p>
          <div className="flex flex-col gap-0.5">
            {group.items.map(item => {
              const active = isActive(item)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    'group relative flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/20',
                    active
                      ? 'bg-white/12 text-white shadow-sm'
                      : 'text-white/68 hover:bg-white/8 hover:text-white'
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  {active && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-tangerine" />}
                  <item.icon className="h-4 w-4 shrink-0" strokeWidth={active ? 2.25 : 1.8} />
                  <span className="flex-1">{item.label}</span>
                  {active && <ChevronRight className="h-3.5 w-3.5 text-tangerine" />}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </>
  )
}

export function AdminSidebar() {
  return (
    <aside className="hidden h-full w-64 shrink-0 flex-col overflow-y-auto border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
      {/* Brand */}
      <div className="flex h-[72px] items-center gap-3 border-b border-white/10 px-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
          <Image src="/logo.png" alt="Val Gadgets" width={112} height={112} className="h-full w-full scale-[2.15] object-contain" priority />
        </div>
        <span className="h-4 w-px bg-white/20" />
        <div>
          <p className="text-sm font-semibold text-white">Admin</p>
          <p className="text-[11px] text-white/55">Store operations</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4" aria-label="Admin navigation">
        <AdminNavLinks />
      </nav>

      {/* Bottom */}
      <div className="space-y-1 border-t border-white/10 px-3 py-3">
        <Link
          href="/"
          className="flex min-h-10 items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-white/68 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-3 focus-visible:ring-tangerine/30"
        >
          <Store className="h-4 w-4" />
          View Storefront
        </Link>
      </div>
    </aside>
  )
}
