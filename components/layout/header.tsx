'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  ShoppingCart, Heart, User, Menu, X, Search, ChevronDown, LogOut, Settings, Package, LayoutDashboard
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/contexts/auth-context'
import { useCart } from '@/contexts/cart-context'
import { useWishlist } from '@/contexts/wishlist-context'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { label: 'Shop', href: '/shop' },
  { label: 'Categories', href: '/categories' },
  { label: 'Raffles', href: '/raffles' },
  { label: 'About', href: '/about' },
]

export function Header() {
  const pathname = usePathname()
  const { user, isAuthenticated, logout, isRole } = useAuth()
  const { itemCount } = useCart()
  const { count: wishlistCount } = useWishlist()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const dashboardHref = isRole('admin') ? '/admin' : isRole('affiliate') ? '/affiliate' : '/account'

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-200',
        scrolled
          ? 'bg-background/95 backdrop-blur-md border-b border-border shadow-sm'
          : 'bg-background border-b border-border'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image src="/logo.png" alt="Val Gadgets" width={160} height={56} className="h-14 w-auto object-contain" priority />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3 py-2 text-sm font-medium rounded-md transition-colors hover:text-primary',
                  pathname.startsWith(link.href) ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Link href="/shop?search=true" aria-label="Search">
              <Button variant="ghost" size="icon" className="hidden sm:flex">
                <Search className="w-4 h-4" />
              </Button>
            </Link>

            <Link href="/wishlist" aria-label={`Wishlist (${wishlistCount} items)`} className="relative">
              <Button variant="ghost" size="icon">
                <Heart className="w-4 h-4" />
                {wishlistCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground border-0">
                    {wishlistCount > 9 ? '9+' : wishlistCount}
                  </Badge>
                )}
              </Button>
            </Link>

            <Link href="/cart" aria-label={`Cart (${itemCount} items)`} className="relative">
              <Button variant="ghost" size="icon">
                <ShoppingCart className="w-4 h-4" />
                {itemCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground border-0">
                    {itemCount > 9 ? '9+' : itemCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="hidden sm:flex items-center gap-1.5 font-medium">
                    <User className="w-4 h-4" />
                    <span className="max-w-[80px] truncate text-sm">{user?.name?.split(' ')[0]}</span>
                    <ChevronDown className="w-3 h-3 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href={dashboardHref} className="flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account/orders" className="flex items-center gap-2">
                      <Package className="w-4 h-4" /> My Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account/profile" className="flex items-center gap-2">
                      <Settings className="w-4 h-4" /> Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive flex items-center gap-2">
                    <LogOut className="w-4 h-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                  <Link href="/register">Register</Link>
                </Button>
              </div>
            )}

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(v => !v)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <nav
            className="md:hidden border-t border-border py-4 flex flex-col gap-1 animate-fade-in"
            aria-label="Mobile navigation"
          >
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3 py-2.5 text-sm font-medium rounded-md transition-colors',
                  pathname.startsWith(link.href)
                    ? 'bg-accent text-primary'
                    : 'text-foreground hover:bg-accent'
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 mt-1 border-t border-border flex flex-col gap-2">
              {isAuthenticated ? (
                <>
                  <Link href={dashboardHref} className="px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent rounded-md">
                    Dashboard
                  </Link>
                  <button
                    onClick={logout}
                    className="px-3 py-2.5 text-sm font-medium text-destructive hover:bg-accent rounded-md text-left"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/login">Sign in</Link>
                  </Button>
                  <Button className="w-full bg-primary text-primary-foreground" asChild>
                    <Link href="/register">Register</Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
