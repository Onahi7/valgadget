'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import {
  ShoppingCart, Heart, User, Menu, X, Search, ChevronDown,
  LogOut, Settings, Package, LayoutDashboard, Ticket,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
  { label: 'About', href: '/about' },
]

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAuthenticated, logout, isRole } = useAuth()
  const { itemCount } = useCart()
  const { count: wishlistCount } = useWishlist()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const dashboardHref = isRole('admin') ? '/admin' : isRole('affiliate') ? '/affiliate' : '/account'

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-200',
        scrolled
          ? 'bg-background/95 backdrop-blur-md shadow-sm'
          : 'bg-background'
      )}
    >
      {/* Top bar */}
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center shrink-0">
              <Image src="/logo.png" alt="Val Gadgets" width={180} height={63} className="h-12 w-auto object-contain sm:h-14" priority />
            </Link>

            {/* Search bar - center, prominent */}
            <form
              onSubmit={handleSearch}
              className="hidden sm:flex flex-1 max-w-2xl mx-auto"
            >
              <div className="flex w-full rounded-full border-2 border-primary overflow-hidden shadow-sm">
                <Input
                  ref={searchRef}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search phones, laptops, accessories..."
                  className="flex-1 border-0 ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none pl-5 text-sm bg-background"
                />
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 shrink-0 flex items-center gap-2 transition-colors text-sm font-medium"
                >
                  <Search className="w-4 h-4" />
                  <span className="hidden md:block">Search</span>
                </button>
              </div>
            </form>

            {/* Right actions */}
            <div className="flex items-center gap-1 shrink-0 ml-auto sm:ml-0">
              {/* Mobile search */}
              <Link href="/shop" aria-label="Search" className="sm:hidden">
                <Button variant="ghost" size="icon">
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
                  <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-4" asChild>
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
        </div>
      </div>

      {/* Nav bar */}
      <div className="hidden md:block border-b border-border bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1 h-11" aria-label="Main navigation">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-4 py-1.5 text-sm font-medium rounded-full transition-colors',
                  pathname.startsWith(link.href)
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                {link.label}
              </Link>
            ))}
            <span className="mx-2 h-4 w-px bg-border" />
            <Link
              href="/raffles"
              className="px-4 py-1.5 text-sm font-medium rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1.5"
            >
              <Ticket className="h-3.5 w-3.5" />
              Live Raffles
            </Link>
          </nav>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav
          className="md:hidden border-t border-border py-4 flex flex-col gap-1 bg-background animate-fade-in"
          aria-label="Mobile navigation"
        >
          {/* Mobile search */}
          <form onSubmit={handleSearch} className="px-4 mb-3">
            <div className="flex rounded-full border-2 border-primary overflow-hidden">
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search gadgets..."
                className="flex-1 border-0 ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none pl-4 text-sm bg-background"
              />
              <button type="submit" className="bg-primary text-primary-foreground px-4 shrink-0">
                <Search className="w-4 h-4" />
              </button>
            </div>
          </form>

          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'mx-2 px-3 py-2.5 text-sm font-medium rounded-md transition-colors',
                pathname.startsWith(link.href)
                  ? 'bg-accent text-primary'
                  : 'text-foreground hover:bg-accent'
              )}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 mt-1 mx-2 border-t border-border flex flex-col gap-2">
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
                <Button variant="outline" asChild className="w-full rounded-full">
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button className="w-full bg-primary text-primary-foreground rounded-full" asChild>
                  <Link href="/register">Register</Link>
                </Button>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  )
}
