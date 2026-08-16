'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Search, Loader2, Package, Tag } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface ProductHit {
  id: string
  name: string
  slug: string
  price: number
  image: string
  category?: { name: string; slug: string }
}

interface CategoryHit {
  id: string
  name: string
  slug: string
}

interface SearchResults {
  products: ProductHit[]
  categories: CategoryHit[]
}

interface TypeaheadSearchProps {
  className?: string
  inputClassName?: string
  placeholder?: string
  onResultClick?: () => void
}

/**
 * Industry-standard typeahead search with grouped results.
 * Debounced fetch from /api/products?q= and /api/categories flat list.
 */
export function TypeaheadSearch({
  className = '',
  inputClassName = '',
  placeholder = 'Search products, categories...',
  onResultClick,
}: TypeaheadSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults>({ products: [], categories: [] })
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const wrapRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length < 2) {
      setResults({ products: [], categories: [] })
      setLoading(false)
      return
    }
    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch(`/api/products?search=${encodeURIComponent(query)}&limit=5`),
          fetch(`/api/categories/flat`),
        ])
        const products = prodRes.ok ? (await prodRes.json()).data ?? [] : []
        const allCats = catRes.ok ? (await catRes.json()) : []
        const categories = Array.isArray(allCats)
          ? allCats
              .filter((c: CategoryHit) =>
                c.name.toLowerCase().includes(query.toLowerCase())
              )
              .slice(0, 4)
          : []
        setResults({ products, categories })
      } catch {
        setResults({ products: [], categories: [] })
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  // Click outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const allResults = [
    ...results.products.map(p => ({ type: 'product' as const, ...p })),
    ...results.categories.map(c => ({ type: 'category' as const, ...c })),
  ]

  const handleSelect = (idx: number) => {
    const item = allResults[idx]
    if (!item) return
    if (item.type === 'product') {
      router.push(`/products/${item.slug}`)
    } else {
      router.push(`/categories/${item.slug}`)
    }
    setOpen(false)
    setQuery('')
    onResultClick?.()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/shop?search=${encodeURIComponent(query.trim())}`)
      setOpen(false)
      onResultClick?.()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, allResults.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault()
      handleSelect(activeIdx)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const hasResults = results.products.length > 0 || results.categories.length > 0

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className="flex w-full rounded-full border-2 border-primary overflow-hidden shadow-sm bg-background">
          <div className="relative flex-1">
            <Input
              value={query}
              onChange={e => { setQuery(e.target.value); setOpen(true); setActiveIdx(-1) }}
              onFocus={() => setOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={`border-0 ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none pl-4 text-sm bg-background ${inputClassName}`}
              autoComplete="off"
            />
          </div>
          <button
            type="submit"
            aria-label="Search"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 sm:px-5 shrink-0 flex items-center gap-2 transition-colors text-sm font-medium"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span className="hidden md:inline">Search</span>
          </button>
        </div>
      </form>

      {/* Dropdown */}
      {open && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[60vh] overflow-y-auto rounded-lg border border-border bg-card shadow-lg animate-fade-in">
          {loading && !hasResults ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Searching...</div>
          ) : !hasResults ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No results for &quot;{query}&quot;
              <p className="mt-1 text-xs">Try different keywords or browse all products</p>
            </div>
          ) : (
            <>
              {results.categories.length > 0 && (
                <div>
                  <p className="border-b border-border bg-muted/50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Categories
                  </p>
                  {results.categories.map(cat => {
                    const idx = results.categories.indexOf(cat)
                    return (
                      <button
                        key={cat.id}
                        onClick={() => handleSelect(idx)}
                        onMouseEnter={() => setActiveIdx(idx)}
                        className={cn(
                          'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-accent',
                          activeIdx === idx && 'bg-accent'
                        )}
                      >
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <span>{cat.name}</span>
                      </button>
                    )
                  })}
                </div>
              )}
              {results.products.length > 0 && (
                <div>
                  <p className="border-y border-border bg-muted/50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Products
                  </p>
                  {results.products.map(prod => {
                    const idx = results.categories.length + results.products.indexOf(prod)
                    return (
                      <button
                        key={prod.id}
                        onClick={() => handleSelect(idx)}
                        onMouseEnter={() => setActiveIdx(idx)}
                        className={cn(
                          'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-accent',
                          activeIdx === idx && 'bg-accent'
                        )}
                      >
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-border bg-white">
                          <Image src={prod.image} alt={prod.name} fill sizes="40px" className="object-contain p-1" unoptimized />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 font-medium">{prod.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {prod.category?.name && `${prod.category.name} · `}
                            {formatPrice(prod.price, false)}
                          </p>
                        </div>
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </button>
                    )
                  })}
                </div>
              )}
              <div className="border-t border-border bg-muted/30 p-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center"
                  onClick={handleSubmit}
                >
                  See all results for &quot;{query}&quot;
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
