'use client'

import { useState, useEffect, useCallback } from 'react'
import { SlidersHorizontal, X, Search, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { ProductGrid } from '@/components/ecommerce/product-grid'
import { ProductCardSkeleton } from '@/components/ecommerce/product-card-skeleton'
import { VgPagination } from '@/components/ui/vg-pagination'
import { productService, type Product, type ProductsResponse } from '@/lib/services/product.service'
import { categoryService, type Category } from '@/lib/services/category.service'
import { useDebounce } from '@/hooks/use-debounce'

const SORT_OPTIONS = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
]

const PRICE_RANGES = [
  { label: 'Under ₦10,000',      min: 0,     max: 10000 },
  { label: '₦10,000 – ₦50,000', min: 10000, max: 50000 },
  { label: '₦50,000 – ₦150,000',min: 50000, max: 150000 },
  { label: '₦150,000+',          min: 150000, max: Infinity },
]

const PAGE_SIZE = 8

export default function ShopPage() {
  const [search, setSearch]               = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedPrice, setSelectedPrice] = useState<{ min: number; max: number } | null>(null)
  const [sort, setSort]                   = useState('popular')
  const [page, setPage]                   = useState(1)

  const [categories, setCategories]   = useState<Category[]>([])
  const [products, setProducts]       = useState<Product[]>([])
  const [total, setTotal]             = useState(0)
  const [totalPages, setTotalPages]   = useState(1)
  const [loading, setLoading]         = useState(true)

  const debouncedSearch = useDebounce(search, 400)

  // Load categories once
  useEffect(() => {
    categoryService.getFlat().then(res => {
      if (Array.isArray(res)) setCategories(res as any[])
    })
  }, [])

  // Load products whenever filters change
  useEffect(() => {
    setLoading(true)
    const sortParam = sort as 'popular' | 'newest' | 'price_asc' | 'price_desc' | 'rating'
    productService.getAll({
      page,
      limit: PAGE_SIZE,
      search: debouncedSearch || undefined,
      category: selectedCategory ?? undefined,
      minPrice: selectedPrice?.min,
      maxPrice: selectedPrice?.max === Infinity ? undefined : selectedPrice?.max,
      sort: sortParam,
    }).then(res => {
      const r = res as any
      if (r?.data) {
        setProducts(r.data)
        setTotal(r.total)
        setTotalPages(r.totalPages)
      }
    }).finally(() => setLoading(false))
  }, [debouncedSearch, selectedCategory, selectedPrice, sort, page])

  const resetPage = useCallback(() => setPage(1), [])

  const activeFilters: string[] = []
  if (selectedCategory) activeFilters.push(categories.find(c => c.id === selectedCategory)?.name ?? '')
  if (selectedPrice) activeFilters.push(PRICE_RANGES.find(p => p.min === selectedPrice.min)?.label ?? '')

  const FilterPanel = () => (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="font-bold text-xs uppercase tracking-widest text-muted-foreground mb-3 font-mono">Category</h3>
        <div className="flex flex-col gap-1">
          <button
            onClick={() => { setSelectedCategory(null); resetPage() }}
            className={`text-left px-3 py-2 rounded-md text-sm transition-colors ${!selectedCategory ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-accent text-muted-foreground'}`}
          >
            All Categories
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => { setSelectedCategory(cat.id); resetPage() }}
              className={`text-left px-3 py-2 rounded-md text-sm transition-colors flex justify-between items-center ${selectedCategory === cat.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-accent text-muted-foreground'}`}
            >
              <span>{cat.name}</span>
              <span className="text-xs opacity-60">{cat.productCount}</span>
            </button>
          ))}
        </div>
      </div>
      <Separator />
      <div>
        <h3 className="font-bold text-xs uppercase tracking-widest text-muted-foreground mb-3 font-mono">Price Range</h3>
        <div className="flex flex-col gap-1">
          <button
            onClick={() => { setSelectedPrice(null); resetPage() }}
            className={`text-left px-3 py-2 rounded-md text-sm transition-colors ${!selectedPrice ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-accent text-muted-foreground'}`}
          >
            Any Price
          </button>
          {PRICE_RANGES.map(range => (
            <button
              key={range.label}
              onClick={() => { setSelectedPrice({ min: range.min, max: range.max }); resetPage() }}
              className={`text-left px-3 py-2 rounded-md text-sm transition-colors ${selectedPrice?.min === range.min ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-accent text-muted-foreground'}`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-page-reveal">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">Shop</h1>
        <p className="text-muted-foreground">Discover {total}+ premium gadgets</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={e => { setSearch(e.target.value); resetPage() }}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <div className="relative">
            <select
              value={sort}
              onChange={e => { setSort(e.target.value); setPage(1) }}
              className="appearance-none bg-card border border-border rounded-md pl-3 pr-8 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="md:hidden gap-2">
                <SlidersHorizontal className="w-4 h-4" /> Filters
                {activeFilters.length > 0 && (
                  <Badge className="bg-primary text-primary-foreground text-[10px] border-0 h-4 px-1">
                    {activeFilters.length}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
              <div className="mt-6"><FilterPanel /></div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Active filters */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <span className="text-xs text-muted-foreground">Active:</span>
          {activeFilters.map(f => (
            <Badge key={f} variant="secondary" className="gap-1 text-xs">
              {f}
              <button
                onClick={() => {
                  if (selectedCategory && categories.find(c => c.id === selectedCategory)?.name === f) setSelectedCategory(null)
                  if (selectedPrice && PRICE_RANGES.find(p => p.label === f)) setSelectedPrice(null)
                  setPage(1)
                }}
                aria-label={`Remove ${f} filter`}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          <button
            className="text-xs text-primary hover:underline"
            onClick={() => { setSelectedCategory(null); setSelectedPrice(null); setSearch(''); setPage(1) }}
          >
            Clear all
          </button>
        </div>
      )}

      {/* Layout: Sidebar + Grid */}
      <div className="flex gap-8">
        <aside className="hidden md:block w-56 shrink-0">
          <FilterPanel />
        </aside>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground mb-4">
            {loading ? 'Loading...' : `${total} product${total !== 1 ? 's' : ''} found`}
          </p>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : (
            <ProductGrid products={products} />
          )}
          {totalPages > 1 && !loading && (
            <div className="mt-10">
              <VgPagination page={page} totalPages={totalPages} onPageChange={p => { setPage(p); window.scrollTo(0, 0) }} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
