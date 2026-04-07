'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ShoppingBag, ShoppingCart, Users, Tag, Ticket,
  Share2, Settings, ChevronRight, Zap, TrendingUp, MessageCircle, Truck,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_GROUPS = [
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
    ],
  },
]

export function AdminSidebar() {
  const pathname = usePathname()

  const isActive = (item: { href: string; exact?: boolean }) => {
    if (item.exact) return pathname === item.href
    return pathname.startsWith(item.href)
  }

  return (
    <aside className="w-60 shrink-0 border-r border-border bg-card flex flex-col h-full overflow-y-auto">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-[18px] border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-sm">
          <Zap className="w-4.5 h-4.5 text-primary-foreground" />
        </div>
        <div>
          <p className="font-bold text-sm leading-none tracking-tight">ValGadget</p>
          <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mt-0.5">Admin Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-5 overflow-y-auto" aria-label="Admin navigation">
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
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative',
                      active
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                  >
                    <item.icon className={cn('w-4 h-4 shrink-0 transition-transform', active ? '' : 'group-hover:scale-110')} />
                    <span className="flex-1">{item.label}</span>
                    {active && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-border space-y-1">
        <Link
          href="/"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <TrendingUp className="w-3.5 h-3.5" />
          View Storefront
        </Link>
      </div>
    </aside>
  )
}

