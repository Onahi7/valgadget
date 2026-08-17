'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { LogOut, ChevronRight, Menu, ChevronRight as ChevronRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NAV_GROUPS } from '@/components/admin/admin-sidebar'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const SEGMENT_LABELS: Record<string, string> = {
  admin: 'Admin', products: 'Products', orders: 'Orders', customers: 'Customers',
  categories: 'Categories', raffles: 'Raffles', affiliate: 'Affiliates',
  settings: 'Settings', shipping: 'Shipping', reviews: 'Reviews', coupons: 'Coupons',
  chat: 'Chat', new: 'New', edit: 'Edit', 'activity-log': 'Activity Log',
}

function getBreadcrumbs(pathname: string) {
  const parts = pathname.split('/').filter(Boolean)
  return parts.map((part, i) => ({
    label: SEGMENT_LABELS[part] ?? part,
    href: '/' + parts.slice(0, i + 1).join('/'),
    isLast: i === parts.length - 1,
  }))
}

export function AdminHeader() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const router = useRouter()
  const breadcrumbs = getBreadcrumbs(pathname)
  const [sheetOpen, setSheetOpen] = useState(false)

  const isActive = (item: { href: string; exact?: boolean }) => {
    if (item.exact) return pathname === item.href
    return pathname.startsWith(item.href)
  }

  const handleLogout = async () => {
    await logout()
    toast('Signed out')
    router.replace('/login')
  }

  return (
    <header className="h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 shrink-0 gap-3">
      {/* Mobile slide-out sidebar */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden" aria-label="Open admin navigation">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex items-center gap-3 px-5 py-[18px] border-b border-border">
            <Image src="/logo.png" alt="Val Gadgets" width={120} height={42} className="h-10 w-auto object-contain" priority />
            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Admin</p>
          </div>
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
                        onClick={() => setSheetOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all group relative',
                          active
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                        )}
                      >
                        <item.icon className={cn('w-4 h-4 shrink-0 transition-transform', active ? '' : 'group-hover:scale-110')} />
                        <span className="flex-1">{item.label}</span>
                        {active && <ChevronRightIcon className="w-3.5 h-3.5 opacity-60" />}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>
          <div className="px-3 py-4 border-t border-border">
            <Link
              href="/"
              onClick={() => setSheetOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              View Storefront
            </Link>
          </div>
        </SheetContent>
      </Sheet>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm min-w-0 flex-1" aria-label="Breadcrumb">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1 min-w-0">
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
            {crumb.isLast ? (
              <span className="font-semibold truncate">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="text-muted-foreground hover:text-foreground transition-colors truncate">
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      <div className="flex items-center gap-1 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-accent transition-colors">
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                {user?.name?.[0]?.toUpperCase() ?? 'A'}
              </div>
              <span className="text-sm font-medium hidden sm:block max-w-[120px] truncate">{user?.name ?? 'Admin'}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="font-normal">
              <p className="font-semibold text-sm truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive gap-2 cursor-pointer">
              <LogOut className="w-4 h-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

