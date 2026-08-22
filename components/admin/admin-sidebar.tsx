'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ShoppingBag, ShoppingCart, Users, Tag, Ticket,
  Share2, Settings, ChevronRight, TrendingUp, MessageCircle, Truck,
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
          <p className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 font-mono">
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
                    'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
                    active
                      ? 'bg-[#edf3ed] text-primary'
                      : 'text-muted-foreground hover:bg-[#f3f5f3] hover:text-foreground'
                  )}
                >
                  {active && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary" />}
                  <item.icon className="h-4 w-4 shrink-0" strokeWidth={active ? 2.25 : 1.8} />
                  <span className="flex-1">{item.label}</span>
                  {active && <ChevronRight className="h-3.5 w-3.5 opacity-50" />}
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
    <aside className="hidden h-full w-60 shrink-0 flex-col overflow-y-auto border-r border-[#e3e7e3] bg-white md:flex">
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-[#e9ece9] px-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden">
          <Image src="/logo.png" alt="Val Gadgets" width={96} height={96} className="h-full w-full scale-[1.9] object-contain" priority />
        </div>
        <span className="h-4 w-px bg-border" />
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Admin</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4" aria-label="Admin navigation">
        <AdminNavLinks />
      </nav>

      {/* Bottom */}
      <div className="space-y-1 border-t border-[#e9ece9] px-3 py-3">
        <Link
          href="/"
          className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <TrendingUp className="w-3.5 h-3.5" />
          View Storefront
        </Link>
      </div>
    </aside>
  )
}
