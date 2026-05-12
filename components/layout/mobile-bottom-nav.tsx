'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Grid3X3, ShoppingCart, User, Heart } from 'lucide-react'
import { useCart } from '@/contexts/cart-context'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/',           icon: Home,         label: 'Home' },
  { href: '/categories', icon: Grid3X3,      label: 'Categories' },
  { href: '/cart',       icon: ShoppingCart,  label: 'Cart' },
  { href: '/wishlist',   icon: Heart,        label: 'Wishlist' },
  { href: '/account',   icon: User,          label: 'Account' },
]

export function MobileBottomNav() {
  const pathname = usePathname()
  const { itemCount } = useCart()

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-background/95 backdrop-blur-md border-t border-border safe-area-bottom"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = href === '/'
            ? pathname === '/'
            : pathname.startsWith(href)
          const isCart = href === '/cart'

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-lg transition-colors relative',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label={label}
            >
              <span className="relative">
                <Icon className="w-5 h-5" />
                {isCart && itemCount > 0 && (
                  <Badge className="absolute -top-2 -right-2.5 h-4 min-w-4 p-0 flex items-center justify-center text-[9px] bg-primary text-primary-foreground border-0">
                    {itemCount > 9 ? '9+' : itemCount}
                  </Badge>
                )}
              </span>
              <span className="text-[10px] font-medium leading-none mt-0.5">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
