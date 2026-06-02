'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Home, Grid3X3, ShoppingCart, User, Heart, X } from 'lucide-react'
import { useCart } from '@/contexts/cart-context'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { categoryService, type Category } from '@/lib/services/category.service'

export function MobileBottomNav() {
  const pathname = usePathname()
  const { itemCount } = useCart()
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    categoryService.getAll().then(cats => {
      setCategories(cats.filter(c => !c.parentId))
    }).catch(() => {})
  }, [])

  // Close categories panel on route change
  useEffect(() => {
    setCategoriesOpen(false)
  }, [pathname])

  return (
    <>
      {/* Categories overlay */}
      {categoriesOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setCategoriesOpen(false)}
        />
      )}

      {/* Categories slide-up panel */}
      {categoriesOpen && (
        <div className="fixed bottom-16 inset-x-0 z-40 md:hidden bg-background border-t border-border animate-fade-in max-h-[60vh] overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="text-sm font-bold">Shop by Category</p>
            <button onClick={() => setCategoriesOpen(false)} className="p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
          <nav className="flex flex-col py-2">
            {categories.map(cat => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className={cn(
                  'px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent',
                  pathname === `/categories/${cat.slug}` ? 'bg-accent text-primary' : 'text-foreground'
                )}
              >
                {cat.name}
              </Link>
            ))}
            <Link
              href="/categories"
              className="px-4 py-2.5 text-sm font-medium text-primary hover:bg-accent border-t border-border mt-2"
            >
              View All Categories
            </Link>
          </nav>
        </div>
      )}

      {/* Bottom nav bar */}
      <nav
        className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-background/95 backdrop-blur-md border-t border-border safe-area-bottom"
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-around h-16 px-2">
          <Link
            href="/"
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-lg transition-colors relative',
              pathname === '/' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
            aria-label="Home"
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-none mt-0.5">Home</span>
          </Link>

          <button
            onClick={() => setCategoriesOpen(v => !v)}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-lg transition-colors',
              categoriesOpen ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
            aria-label="Categories"
          >
            <Grid3X3 className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-none mt-0.5">Shop</span>
          </button>

          <Link
            href="/cart"
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-lg transition-colors relative',
              pathname === '/cart' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
            aria-label="Cart"
          >
            <span className="relative">
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <Badge className="absolute -top-2 -right-2.5 h-4 min-w-4 p-0 flex items-center justify-center text-[9px] bg-primary text-primary-foreground border-0">
                  {itemCount > 9 ? '9+' : itemCount}
                </Badge>
              )}
            </span>
            <span className="text-[10px] font-medium leading-none mt-0.5">Cart</span>
          </Link>

          <Link
            href="/wishlist"
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-lg transition-colors',
              pathname === '/wishlist' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
            aria-label="Wishlist"
          >
            <Heart className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-none mt-0.5">Wishlist</span>
          </Link>

          <Link
            href="/account"
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-lg transition-colors',
              pathname === '/account' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
            aria-label="Account"
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-none mt-0.5">Account</span>
          </Link>
        </div>
      </nav>
    </>
  )
}
