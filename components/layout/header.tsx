'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import {
  ChevronDown,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingCart,
  Ticket,
  User,
  X,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { TypeaheadSearch } from '@/components/ecommerce/typeahead-search'
import { useCartDrawer } from '@/contexts/cart-drawer-context'
import { useAuth } from '@/contexts/auth-context'
import { useCart } from '@/contexts/cart-context'
import { useWishlist } from '@/contexts/wishlist-context'
import { categoryService, type Category } from '@/lib/services/category.service'
import { cn } from '@/lib/utils'

const SECONDARY_LINKS = [
  { label: 'Deals', href: '/deals', highlight: true },
  { label: 'New arrivals', href: '/shop?sort=newest' },
  { label: 'Live raffles', href: '/raffles' },
]

const FALLBACK_NAV_CATEGORIES: Category[] = [
  ['iPhones', 'iphones', 2],
  ['Tablets', 'tablets', 1],
  ['Wearables', 'wearables-smart-devices', 1],
  ['Speakers', 'speakers', 2],
  ['Monitors', 'monitors', 1],
  ['Laptops', 'laptops', 0],
].map(([name, slug, productCount], index) => ({
  id: `fallback-${slug}`,
  name: String(name),
  slug: String(slug),
  productCount: Number(productCount),
  isActive: true,
  sortOrder: index,
  createdAt: '',
  updatedAt: '',
}))

export function Header() {
  const pathname = usePathname()
  const { user, isAuthenticated, logout, isRole } = useAuth()
  const { itemCount } = useCart()
  const { count: wishlistCount } = useWishlist()
  const { openCart } = useCartDrawer()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>(FALLBACK_NAV_CATEGORIES)

  useEffect(() => setMobileOpen(false), [pathname])
  useEffect(() => {
    categoryService.getFlat().then(rows => setCategories(rows.filter(row => !row.parentId))).catch(() => {})
  }, [])

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => Number((b.productCount ?? 0) > 0) - Number((a.productCount ?? 0) > 0)),
    [categories]
  )
  const activeCategories = sortedCategories.filter(category => (category.productCount ?? 0) > 0)
  const dashboardHref = isRole('admin') ? '/admin' : isRole('affiliate') ? '/affiliate' : '/account'

  const accountMenu = isAuthenticated ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="hidden h-10 items-center gap-2 rounded-md px-2 text-left text-sm font-semibold hover:bg-muted sm:flex">
          <User className="h-5 w-5" />
          <span className="hidden xl:block"><span className="block text-[10px] font-normal text-muted-foreground">Hello, {user?.name?.split(' ')[0]}</span>Account</span>
          <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground xl:block" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem asChild><Link href={dashboardHref}><LayoutDashboard className="h-4 w-4" /> Dashboard</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href="/account/orders"><Package className="h-4 w-4" /> My orders</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href="/account/profile"><Settings className="h-4 w-4" /> Profile</Link></DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive"><LogOut className="h-4 w-4" /> Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : (
    <Link href="/login" className="hidden h-10 items-center gap-2 rounded-md px-2 text-sm font-semibold hover:bg-muted sm:flex">
      <User className="h-5 w-5" />
      <span className="hidden xl:block"><span className="block text-[10px] font-normal text-muted-foreground">Hello, sign in</span>Account</span>
    </Link>
  )

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm">
      <div className="mx-auto flex h-[68px] max-w-[1440px] items-center gap-3 px-4 sm:h-[74px] sm:gap-5 sm:px-6 lg:px-8">
        <Button variant="ghost" size="icon" className="shrink-0 md:hidden" onClick={() => setMobileOpen(value => !value)} aria-label={mobileOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileOpen}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Val Gadgets home">
          <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-md bg-white sm:h-14 sm:w-14">
            <Image src="/logo.png" alt="" width={112} height={112} className="h-full w-full scale-[1.85] object-contain" priority />
          </span>
          <span className="hidden font-display text-xl font-bold text-secondary lg:block xl:text-2xl">Val Gadgets</span>
        </Link>

        <div className="hidden min-w-0 flex-1 sm:block">
          <TypeaheadSearch className="mx-auto w-full max-w-3xl" placeholder="Search products, brands and categories" />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:ml-0 lg:gap-1">
          {accountMenu}
          <Link href="/account/orders" className="hidden h-10 items-center gap-2 rounded-md px-2 text-sm font-semibold hover:bg-muted lg:flex">
            <Package className="h-5 w-5" /><span className="hidden xl:block">Track<br />order</span>
          </Link>
          <Link href="/wishlist" aria-label={`Wishlist (${wishlistCount} items)`} className="relative flex h-10 items-center gap-2 rounded-md px-2 text-sm font-semibold hover:bg-muted">
            <Heart className="h-5 w-5" /><span className="hidden xl:inline">Wishlist</span>
            {wishlistCount > 0 && <Badge className="absolute -right-0.5 top-0 h-4 min-w-4 p-0 text-[9px]">{wishlistCount > 9 ? '9+' : wishlistCount}</Badge>}
          </Link>
          <button onClick={openCart} aria-label={`Cart (${itemCount} items)`} className="relative flex h-10 items-center gap-2 rounded-md px-2 text-sm font-semibold hover:bg-muted">
            <ShoppingCart className="h-5 w-5" /><span className="hidden xl:inline">Cart</span>
            {itemCount > 0 && <Badge className="absolute -right-0.5 top-0 h-4 min-w-4 p-0 text-[9px]">{itemCount > 9 ? '9+' : itemCount}</Badge>}
          </button>
        </div>
      </div>

      <div className="px-4 pb-3 sm:hidden"><TypeaheadSearch placeholder="Search products, brands and categories" /></div>

      <div className="bg-secondary text-white">
        <div className="mx-auto flex h-11 max-w-[1440px] items-center overflow-hidden px-2 sm:px-6 lg:px-8">
          <Sheet open={categoriesOpen} onOpenChange={setCategoriesOpen}>
            <SheetTrigger asChild>
              <button className="flex h-9 shrink-0 items-center gap-2 rounded-md bg-primary px-3 text-sm font-bold hover:bg-primary/90 sm:px-4">
                <Menu className="h-4 w-4" /> All departments
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <SheetHeader className="border-b p-5"><SheetTitle>All departments</SheetTitle></SheetHeader>
              <nav className="max-h-[calc(100vh-76px)] overflow-y-auto py-2">
                {sortedCategories.map(category => {
                  const available = (category.productCount ?? 0) > 0
                  return available ? <Link key={category.id} href={`/categories/${category.slug}`} onClick={() => setCategoriesOpen(false)} className="flex items-center justify-between px-5 py-3 text-sm font-medium hover:bg-muted hover:text-primary"><span>{category.name}</span><ChevronDown className="h-4 w-4 -rotate-90" /></Link> : <span key={category.id} className="flex cursor-not-allowed items-center justify-between px-5 py-3 text-sm text-muted-foreground"><span>{category.name}</span><span className="text-[10px] uppercase">Soon</span></span>
                })}
              </nav>
            </SheetContent>
          </Sheet>

          <nav className="ml-3 flex min-w-0 flex-1 items-center gap-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Departments">
            {activeCategories.slice(0, 7).map(category => <Link key={category.id} href={`/categories/${category.slug}`} className="shrink-0 px-3 py-3 text-xs font-semibold text-white/90 hover:bg-white/10 hover:text-white lg:px-4 lg:text-sm">{category.name}</Link>)}
            {SECONDARY_LINKS.map(link => <Link key={link.href} href={link.href} className={cn('shrink-0 px-3 py-3 text-xs font-semibold hover:bg-white/10 lg:px-4 lg:text-sm', link.highlight ? 'text-[#F26A32]' : 'text-white/90')}>{link.label}</Link>)}
          </nav>
        </div>
      </div>

      {mobileOpen && (
        <nav className="max-h-[65vh] overflow-y-auto border-b bg-white p-4 shadow-xl md:hidden" aria-label="Mobile navigation">
          <div className="grid grid-cols-2 gap-2">
            <Link href="/shop" className="rounded-md bg-muted px-3 py-3 text-sm font-semibold">Shop all</Link>
            <Link href="/deals" className="rounded-md bg-accent px-3 py-3 text-sm font-semibold text-tangerine">Deals</Link>
            <Link href="/raffles" className="flex items-center gap-2 rounded-md bg-muted px-3 py-3 text-sm font-semibold"><Ticket className="h-4 w-4" /> Raffles</Link>
            <Link href="/categories" className="rounded-md bg-muted px-3 py-3 text-sm font-semibold">Categories</Link>
          </div>
          <p className="mb-2 mt-5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Departments</p>
          <div className="flex flex-col">{activeCategories.map(category => <Link key={category.id} href={`/categories/${category.slug}`} className="border-b px-1 py-3 text-sm font-medium last:border-0">{category.name}</Link>)}</div>
          {!isAuthenticated && <Link href="/login" className="mt-4 flex h-10 items-center justify-center rounded-md bg-primary text-sm font-bold text-white">Sign in</Link>}
        </nav>
      )}
    </header>
  )
}
