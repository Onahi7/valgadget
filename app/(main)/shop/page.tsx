'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Filter as FilterIcon, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { ProductCardSkeleton } from '@/components/ecommerce/product-card-skeleton'
import { ProductGrid } from '@/components/ecommerce/product-grid'
import { FilterSidebar, ActiveFilterChips, type Facets, type ActiveFilters } from '@/components/ecommerce/filter-sidebar'
import { VgPagination } from '@/components/ui/vg-pagination'
import { useDebounce } from '@/hooks/use-debounce'
import { productService, type Product } from '@/lib/services/product.service'
import { categoryService } from '@/lib/services/category.service'

const SORT_OPTIONS = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
] as const

const PAGE_SIZE = 12

const EMPTY_FILTERS: ActiveFilters = {
  brands: [],
  inStock: false,
  tags: [],
}

function ShopPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const categorySlug = searchParams.get('category') ?? undefined

  // Form state
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [filters, setFilters] = useState<ActiveFilters>(EMPTY_FILTERS)
  const [sort, setSort] = useState<(typeof SORT_OPTIONS)[number]['value']>('popular')
  const [page, setPage] = useState(1)

  // Data
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [facets, setFacets] = useState<Facets | null>(null)
  const [categoryName, setCategoryName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterOpen, setFilterOpen] = useState(false)

  const debouncedSearch = useDebounce(search, 400)
  const resetPage = useCallback(() => setPage(1), [])

  // Sync from URL
  useEffect(() => {
    setSearch(searchParams.get('search') ?? '')
    setPage(1)
  }, [searchParams])

  // Load category name
  useEffect(() => {
    if (!categorySlug) {
      setCategoryName(null)
      return
    }
    categoryService.getBySlug(categorySlug).then(c => {
      setCategoryName(c?.name ?? null)
    }).catch(() => setCategoryName(null))
  }, [categorySlug])

  // Load facets
  useEffect(() => {
    productService.getFacets(categorySlug).then(setFacets).catch(() => setFacets(null))
  }, [categorySlug])

  // Load products
  useEffect(() => {
    setLoading(true)
    productService
      .getAll({
        page,
        limit: PAGE_SIZE,
        category: categorySlug,
        search: debouncedSearch || undefined,
        minPrice: filters.priceMin,
        maxPrice: filters.priceMax,
        sort,
        inStock: filters.inStock || undefined,
        brand: filters.brands.length ? filters.brands.join(',') : undefined,
        tags: filters.tags.length ? filters.tags.join(',') : undefined,
      })
      .then(res => {
        const r = res as any
        if (r?.data) {
          setProducts(r.data)
          setTotal(r.total)
          setTotalPages(r.totalPages)
        }
      })
      .finally(() => setLoading(false))
  }, [categorySlug, debouncedSearch, page, filters, sort])

  const clearFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS)
    setPage(1)
  }, [])

  const handleRemove = useCallback((key: keyof ActiveFilters, value?: string) => {
    setFilters(prev => {
      if (key === 'brands' && value) {
        return { ...prev, brands: prev.brands.filter(b => b !== value) }
      }
      if (key === 'tags' && value) {
        return { ...prev, tags: prev.tags.filter(t => t !== value) }
      }
      if (key === 'inStock') return { ...prev, inStock: false }
      if (key === 'priceMin') return { ...prev, priceMin: undefined }
      if (key === 'priceMax') return { ...prev, priceMax: undefined }
      return prev
    })
    setPage(1)
  }, [])

  const breadcrumbItems = useMemo(() => {
    const items: { label: string; href?: string }[] = [{ label: 'Shop', href: '/shop' }]
    if (categoryName) items.push({ label: categoryName })
    return items
  }, [categoryName])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-page-reveal">
      <Breadcrumbs items={breadcrumbItems} className="mb-4" />

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {categoryName ?? 'All Products'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {loading ? 'Loading...' : `${total} ${total === 1 ? 'product' : 'products'}`}
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={e => {
              setSearch(e.target.value)
              resetPage()
            }}
            className="pl-9"
          />
        </div>

        {/* Mobile filter trigger */}
        <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="lg:hidden">
              <FilterIcon className="mr-2 h-4 w-4" />
              Filter and sort
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full max-w-sm overflow-y-auto sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Filter</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <FilterSidebar
                facets={facets}
                filters={filters}
                onChange={(f) => { setFilters(f); setPage(1) }}
                onClear={clearFilters}
              />
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2 lg:ml-auto">
          <span className="hidden text-xs uppercase tracking-wide text-muted-foreground lg:inline">Sort by:</span>
          <select
            value={sort}
            onChange={e => {
              setSort(e.target.value as typeof sort)
              setPage(1)
            }}
            className="h-10 rounded-md border border-border bg-card px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {SORT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ActiveFilterChips
        filters={filters}
        facets={facets}
        onRemove={handleRemove}
        onClear={clearFilters}
      />

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Desktop sidebar */}
        <FilterSidebar
          facets={facets}
          filters={filters}
          onChange={(f) => { setFilters(f); setPage(1) }}
          onClear={clearFilters}
          className="hidden lg:block"
        />

        <div>
          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <ProductGrid products={products} />
          )}

          {totalPages > 1 && !loading && (
            <div className="mt-10">
              <VgPagination
                page={page}
                totalPages={totalPages}
                onPageChange={nextPage => {
                  setPage(nextPage)
                  window.scrollTo(0, 0)
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="h-8 w-32 bg-muted animate-pulse rounded mb-2" />
          <div className="h-4 w-48 bg-muted animate-pulse rounded mb-8" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-64 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        </div>
      }
    >
      <ShopPageInner />
    </Suspense>
  )
}
