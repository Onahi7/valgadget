'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { LogOut, ChevronRight, Menu, TrendingUp } from 'lucide-react'
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
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-[#e3e7e3] bg-white px-4 sm:px-6">
      {/* Mobile slide-out sidebar */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg border border-transparent hover:border-border hover:bg-[#f4f6f4] md:hidden" aria-label="Open admin navigation">
            <Menu className="h-[18px] w-[18px]" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex w-64 flex-col gap-0 border-[#e3e7e3] bg-white p-0">
          <SheetTitle className="sr-only">Admin navigation</SheetTitle>
          <SheetDescription className="sr-only">Navigate between administration sections.</SheetDescription>
          <div className="flex h-16 shrink-0 items-center gap-3 border-b border-[#e9ece9] px-5">
            <Image src="/logo.png" alt="Val Gadgets" width={104} height={36} className="h-8 w-auto object-contain" priority />
            <span className="h-4 w-px bg-border" />
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Admin</p>
          </div>
          <nav className="flex-1 py-4 px-3 space-y-5 overflow-y-auto" aria-label="Admin navigation">
            <AdminNavLinks onNavigate={() => setSheetOpen(false)} />
          </nav>
          <div className="px-3 py-4 border-t border-border shrink-0">
            <Link
              href="/"
              onClick={() => setSheetOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <TrendingUp className="w-3.5 h-3.5" />
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
            <button className="flex items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 transition-colors hover:border-border hover:bg-[#f4f6f4]">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground ring-4 ring-[#edf3ed]">
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

