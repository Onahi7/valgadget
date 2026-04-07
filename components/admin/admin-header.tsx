'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Bell, LogOut, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const SEGMENT_LABELS: Record<string, string> = {
  admin: 'Admin', products: 'Products', orders: 'Orders', customers: 'Customers',
  categories: 'Categories', raffles: 'Raffles', affiliate: 'Affiliates',
  settings: 'Settings', new: 'New', edit: 'Edit',
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

  const handleLogout = async () => {
    await logout()
    toast('Signed out')
    router.replace('/login')
  }

  return (
    <header className="h-14 border-b border-border bg-card/60 backdrop-blur-sm flex items-center justify-between px-6 shrink-0 gap-4">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm min-w-0" aria-label="Breadcrumb">
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
        <Button variant="ghost" size="icon" className="w-8 h-8" aria-label="Notifications">
          <Bell className="w-4 h-4" />
        </Button>

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

