'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronDown, Search, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ProductCardSkeleton } from '@/components/ecommerce/product-card-skeleton'
import { ProductGrid } from '@/components/ecommerce/product-grid'
import { VgPagination } from '@/components/ui/vg-pagination'
import { useDebounce } from '@/hooks/use-debounce'
import { productService, type Product } from '@/lib/services/product.service'

const SORT_OPTIONS = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
] as const

const PRICE_RANGES = [
  { label: 'Under ₦10,000', min: 0, max: 10000 },
  { label: '₦10,000 - ₦50,000', min: 10000, max: 50000 },
  { label: '₦50,000 - ₦150,000', min: 50000, max: 150000 },
  { label: '₦150,000+', min: 150000, max: Infinity },
]

const PAGE_SIZE = 8

function ShopPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const categorySlug = searchParams.get('category') ?? undefined

  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [selectedPrice, setSelectedPrice] = useState<{ min: number; max: number } | null>(null)
  const [sort, setSort] = useState<(typeof SORT_OPTIONS)[number]['value']>('popular')
  const [page, setPage] = useState(1)
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const debouncedSearch = useDebounce(search, 400)
  const resetPage = useCallback(() => setPage(1), [])

  useEffect(() => {
    setSearch(searchParams.get('search') ?? '')
    setPage(1)
  }, [searchParams])

  useEffect(() => {
    setLoading(true)
    productService.getAll({
      page,
      limit: PAGE_SIZE,
      category: categorySlug,
      search: debouncedSearch || undefined,
      minPrice: selectedPrice?.min,
      maxPrice: selectedPrice?.max === Infinity ? undefined : selectedPrice?.max,
      sort,
    }).then(res => {
      const r = res as any
      if (r?.data) {
        setProducts(r.data)
        setTotal(r.total)
        setTotalPages(r.totalPages)
      }
    }).finally(() => setLoading(false))
  }, [categorySlug, debouncedSearch, page, selectedPrice, sort])

  const activePriceLabel = selectedPrice
    ? PRICE_RANGES.find(range => range.min === selectedPrice.min)?.label
    : undefined

  const clearFilters = () => {
    setSelectedPrice(null)
    setSearch('')
    setPage(1)
    if (categorySlug || searchParams.get('search')) router.push('/shop')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-page-reveal">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">Shop</h1>
        <p className="text-muted-foreground">Discover {total}+ premium gadgets</p>
      </div>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center">
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

        <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
          <div className="relative">
            <select
              value={sort}
              onChange={e => {
                setSort(e.target.value as typeof sort)
                setPage(1)
              }}
              className="h-10 appearance-none rounded-md border border-border bg-card py-2 pl-3 pr-8 text-sm font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {SORT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
      </div>

      <div className="mb-5 overflow-x-auto pb-1">
        <div className="flex min-w-max items-center gap-2">
          <span className="pr-1 font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Price
          </span>
          <Button
            type="button"
            variant={!selectedPrice ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setSelectedPrice(null)
              resetPage()
            }}
            className="h-9 rounded-md whitespace-nowrap"
          >
            Any Price
          </Button>
          {PRICE_RANGES.map(range => (
            <Button
              key={range.label}
              type="button"
              variant={selectedPrice?.min === range.min ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setSelectedPrice({ min: range.min, max: range.max })
                resetPage()
              }}
              className="h-9 rounded-md whitespace-nowrap"
            >
              {range.label}
            </Button>
          ))}
        </div>
      </div>

      {activePriceLabel && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Active:</span>
          <Badge variant="secondary" className="gap-1 text-xs">
            {activePriceLabel}
            <button
              type="button"
              onClick={() => {
                setSelectedPrice(null)
                setPage(1)
              }}
              aria-label={`Remove ${activePriceLabel} filter`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
          <button
            type="button"
            className="text-xs text-primary hover:underline"
            onClick={clearFilters}
          >
            Clear all
          </button>
        </div>
      )}

      <p className="mb-4 text-sm text-muted-foreground">
        {loading ? 'Loading...' : `${total} product${total !== 1 ? 's' : ''} found`}
      </p>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
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
