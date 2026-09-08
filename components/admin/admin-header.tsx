'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { LogOut, ChevronDown, ChevronRight, Menu, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AdminNavLinks } from '@/components/admin/admin-sidebar'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const SEGMENT_LABELS: Record<string, string> = {
  admin: 'Admin', products: 'Products', orders: 'Orders', customers: 'Customers',
  categories: 'Categories', raffles: 'Raffles', affiliate: 'Affiliates',
  settings: 'Settings', shipping: 'Shipping', reviews: 'Reviews', coupons: 'Coupons',
  chat: 'Chat', new: 'New', edit: 'Edit', 'activity-log': 'Activity Log', 'email-templates': 'Email Templates',
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

  const handleLogout = async () => {
    await logout()
    toast('Signed out')
    router.replace('/admin/login')
    router.refresh()
  }

  return (
    <header className="flex h-[72px] shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-4 sm:px-6">
      {/* Mobile slide-out sidebar */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg border border-transparent hover:border-border hover:bg-muted md:hidden" aria-label="Open admin navigation">
            <Menu className="h-[18px] w-[18px]" />
          </Button>
        </SheetTrigger>
          <SheetContent side="left" className="flex w-72 flex-col gap-0 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground">
          <SheetTitle className="sr-only">Admin navigation</SheetTitle>
          <SheetDescription className="sr-only">Navigate between administration sections.</SheetDescription>
          <div className="flex h-[72px] shrink-0 items-center gap-3 border-b border-white/10 px-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
              <Image src="/logo.png" alt="Val Gadgets" width={112} height={112} className="h-full w-full scale-[2.15] object-contain" priority />
            </div>
            <span className="h-4 w-px bg-white/20" />
            <div>
              <p className="text-sm font-semibold text-white">Admin</p>
              <p className="text-[11px] text-white/55">Store operations</p>
            </div>
          </div>
          <nav className="flex-1 py-4 px-3 space-y-5 overflow-y-auto" aria-label="Admin navigation">
            <AdminNavLinks onNavigate={() => setSheetOpen(false)} />
          </nav>
          <div className="shrink-0 border-t border-white/10 px-3 py-4">
            <Link
              href="/"
              onClick={() => setSheetOpen(false)}
              className="flex min-h-10 items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Store className="h-4 w-4" />
              View Storefront
            </Link>
          </div>
        </SheetContent>
      </Sheet>

      {/* Breadcrumb */}
      <nav className="flex min-w-0 flex-1 items-center gap-1 text-[13px]" aria-label="Breadcrumb">
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
            <button aria-label="Open admin account menu" className="flex min-h-10 items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 transition-colors hover:border-border hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/20">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground ring-4 ring-muted">
                {user?.name?.[0]?.toUpperCase() ?? 'A'}
              </div>
              <span className="text-sm font-medium hidden sm:block max-w-[120px] truncate">{user?.name ?? 'Admin'}</span>
              <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" aria-hidden="true" />
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
