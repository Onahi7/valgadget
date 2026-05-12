'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  User, Package, MapPin, Heart, Share2, LayoutDashboard, LogOut,
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { cn } from '@/lib/utils'

const ACCOUNT_NAV = [
  { href: '/account',           icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/account/orders',    icon: Package,         label: 'My Orders' },
  { href: '/account/profile',   icon: User,            label: 'Profile' },
  { href: '/account/addresses', icon: MapPin,          label: 'Address Book' },
  { href: '/wishlist',          icon: Heart,           label: 'Saved Items' },
  { href: '/affiliate',         icon: Share2,          label: 'Affiliate' },
]

export function AccountSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const firstName = user?.name?.split(' ')[0] ?? 'User'

  return (
    <aside className="w-full lg:w-64 shrink-0">
      <div className="bg-card border border-border rounded-xl overflow-hidden sticky top-24">
        {/* User info header */}
        <div className="p-5 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm uppercase">
              {firstName[0]}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-2 flex flex-col gap-0.5" aria-label="Account navigation">
          {ACCOUNT_NAV.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || (href !== '/account' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-2 border-t border-border">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/5 transition-colors w-full"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  )
}
