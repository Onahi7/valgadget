'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ChevronDown, ChevronRight, Grid3X3, Home, ShoppingCart, Ticket, User, X } from 'lucide-react'
import { useCart } from '@/contexts/cart-context'
import { useCartDrawer } from '@/contexts/cart-drawer-context'
import { useCategoryNavigation } from '@/hooks/use-category-navigation'
import { categoryIsAvailable } from '@/lib/category-navigation'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function MobileBottomNav() {
  const pathname = usePathname()
  const { itemCount } = useCart()
  const { openCart } = useCartDrawer()
  const { groups: categoryGroups } = useCategoryNavigation()
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null)

  useEffect(() => {
    setCategoriesOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!categoriesOpen) return

    const currentGroup = categoryGroups.find(({ parent, children }) =>
      pathname === `/categories/${parent.slug}` || children.some(child => pathname === `/categories/${child.slug}`)
    )
    if (currentGroup) setExpandedCategoryId(currentGroup.parent.id)

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setCategoriesOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [categoriesOpen, categoryGroups, pathname])

  return (
    <>
      {categoriesOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-[60] bg-black/45 md:hidden"
          onClick={() => setCategoriesOpen(false)}
          aria-label="Close categories"
        />
      ) : null}

      {categoriesOpen ? (
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-categories-title"
          className="fixed inset-x-0 bottom-16 z-[70] flex max-h-[72dvh] flex-col overflow-hidden rounded-t-2xl border-t border-border bg-background shadow-2xl md:hidden"
        >
          <header className="flex items-center justify-between border-b border-border px-4 py-3.5">
            <div>
              <h2 id="mobile-categories-title" className="text-base font-extrabold text-foreground">Categories</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Choose a category, then a subcategory</p>
            </div>
            <button
              type="button"
              onClick={() => setCategoriesOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Close categories"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </header>

          <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-2" aria-label="Categories and subcategories">
            {categoryGroups.map(({ parent, children }) => {
              const available = categoryIsAvailable(parent)
              const expanded = expandedCategoryId === parent.id
              const categoryActive = pathname === `/categories/${parent.slug}` || children.some(child => pathname === `/categories/${child.slug}`)

              if (!available) {
                return (
                  <div key={parent.id} className="flex min-h-12 items-center justify-between rounded-lg px-3 py-2.5 text-sm text-muted-foreground" aria-disabled="true">
                    <span>{parent.name}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wide">Coming soon</span>
                  </div>
                )
              }

              if (children.length === 0) {
                return (
                  <Link
                    key={parent.id}
                    href={`/categories/${parent.slug}`}
                    className={cn(
                      'flex min-h-12 items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-muted',
                      categoryActive && 'bg-[#EDF5EF] text-primary',
                    )}
                  >
                    <span>{parent.name}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  </Link>
                )
              }

              return (
                <div key={parent.id} className="border-b border-border/70 py-0.5 last:border-0">
                  <button
                    type="button"
                    onClick={() => setExpandedCategoryId(current => current === parent.id ? null : parent.id)}
                    className={cn(
                      'flex min-h-12 w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors hover:bg-muted',
                      categoryActive && 'text-primary',
                      expanded && 'bg-[#EDF5EF] text-primary',
                    )}
                    aria-expanded={expanded}
                    aria-controls={`mobile-category-${parent.id}`}
                  >
                    <span>
                      <span className="block">{parent.name}</span>
                      <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">
                        {children.length} {children.length === 1 ? 'subcategory' : 'subcategories'}
                      </span>
                    </span>
                    <ChevronDown className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')} aria-hidden="true" />
                  </button>

                  {expanded ? (
                    <div id={`mobile-category-${parent.id}`} className="mb-2 ml-3 border-l-2 border-[#DCE4DE] pl-2">
                      <Link
                        href={`/categories/${parent.slug}`}
                        className="flex min-h-11 items-center justify-between rounded-md px-3 py-2 text-sm font-bold text-primary hover:bg-muted"
                      >
                        Shop all {parent.name}
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                      {children.map(child => categoryIsAvailable(child) ? (
                        <Link
                          key={child.id}
                          href={`/categories/${child.slug}`}
                          className={cn(
                            'flex min-h-11 items-center justify-between rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted hover:text-primary',
                            pathname === `/categories/${child.slug}` && 'bg-muted font-semibold text-primary',
                          )}
                        >
                          <span>{child.name}</span>
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                        </Link>
                      ) : (
                        <div key={child.id} className="flex min-h-11 items-center justify-between px-3 py-2 text-sm text-muted-foreground" aria-disabled="true">
                          <span>{child.name}</span>
                          <span className="text-[10px] font-bold uppercase">Soon</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </nav>

          <div className="border-t border-border bg-[#FAFAF7] p-3">
            <Link href="/categories" className="flex h-11 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              View all categories
            </Link>
          </div>
        </section>
      ) : null}

      <nav
        className="safe-area-bottom fixed inset-x-0 bottom-0 z-[80] border-t border-border bg-background/95 backdrop-blur-md md:hidden"
        aria-label="Mobile navigation"
      >
        <div className="flex h-16 items-center justify-around px-2">
          <Link
            href="/"
            className={cn(
              'relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-1 transition-colors',
              pathname === '/' ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
            )}
            aria-label="Home"
          >
            <Home className="h-5 w-5" aria-hidden="true" />
            <span className="mt-0.5 text-[10px] font-medium leading-none">Home</span>
          </Link>

          <button
            type="button"
            onClick={() => setCategoriesOpen(open => !open)}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-1 transition-colors',
              categoriesOpen || pathname.startsWith('/categories') ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
            )}
            aria-label="Categories"
            aria-expanded={categoriesOpen}
          >
            <Grid3X3 className="h-5 w-5" aria-hidden="true" />
            <span className="mt-0.5 text-[10px] font-medium leading-none">Categories</span>
          </button>

          <button
            type="button"
            onClick={openCart}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-1 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Cart"
          >
            <span className="relative">
              <ShoppingCart className="h-5 w-5" aria-hidden="true" />
              {itemCount > 0 ? (
                <Badge className="absolute -right-2.5 -top-2 flex h-4 min-w-4 items-center justify-center border-0 bg-primary p-0 text-[9px] text-primary-foreground">
                  {itemCount > 9 ? '9+' : itemCount}
                </Badge>
              ) : null}
            </span>
            <span className="mt-0.5 text-[10px] font-medium leading-none">Cart</span>
          </button>

          <Link
            href="/raffles"
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-1 transition-colors',
              pathname.startsWith('/raffles') ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
            )}
            aria-label="Live raffles"
          >
            <span className="relative -mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-background transition-transform active:scale-95">
              <Ticket className="h-5 w-5" aria-hidden="true" />
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulse-dot rounded-full bg-emerald-500 ring-2 ring-background" />
            </span>
            <span className="mt-0.5 text-[10px] font-semibold leading-none">Raffles</span>
          </Link>

          <Link
            href="/account"
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-1 transition-colors',
              pathname.startsWith('/account') ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
            )}
            aria-label="Account"
          >
            <User className="h-5 w-5" aria-hidden="true" />
            <span className="mt-0.5 text-[10px] font-medium leading-none">Account</span>
          </Link>
        </div>
      </nav>
    </>
  )
}
