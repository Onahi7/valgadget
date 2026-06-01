'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'

export interface Facets {
  brands: { value: string; count: number }[]
  priceRange: { min: number; max: number }
  availability: { inStock: number; outOfStock: number; total: number }
  tags: { value: string; count: number }[]
}

export interface ActiveFilters {
  brands: string[]
  inStock: boolean
  priceMin?: number
  priceMax?: number
  tags: string[]
}

interface FilterSidebarProps {
  facets: Facets | null
  filters: ActiveFilters
  onChange: (filters: ActiveFilters) => void
  onClear: () => void
  className?: string
}

const FACET_LIMITS = {
  brands: 8,
  tags: 8,
}

export function FilterSidebar({ facets, filters, onChange, onClear, className = '' }: FilterSidebarProps) {
  const [showAllBrands, setShowAllBrands] = useState(false)
  const [showAllTags, setShowAllTags] = useState(false)
  const [priceRange, setPriceRange] = useState<[number, number]>([
    filters.priceMin ?? facets?.priceRange.min ?? 0,
    filters.priceMax ?? facets?.priceRange.max ?? 0,
  ])

  useEffect(() => {
    setPriceRange([
      filters.priceMin ?? facets?.priceRange.min ?? 0,
      filters.priceMax ?? facets?.priceRange.max ?? 0,
    ])
  }, [filters.priceMin, filters.priceMax, facets?.priceRange.min, facets?.priceRange.max])

  if (!facets) {
    return (
      <aside className={className}>
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-md bg-muted" />
          ))}
        </div>
      </aside>
    )
  }

  const toggleBrand = (brand: string) => {
    const next = filters.brands.includes(brand)
      ? filters.brands.filter(b => b !== brand)
      : [...filters.brands, brand]
    onChange({ ...filters, brands: next })
  }

  const toggleTag = (tag: string) => {
    const next = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag]
    onChange({ ...filters, tags: next })
  }

  const handlePriceCommit = (value: [number, number]) => {
    onChange({
      ...filters,
      priceMin: value[0] === facets.priceRange.min ? undefined : value[0],
      priceMax: value[1] === facets.priceRange.max ? undefined : value[1],
    })
  }

  const activeFilterCount =
    filters.brands.length +
    filters.tags.length +
    (filters.inStock ? 1 : 0) +
    (filters.priceMin !== undefined ? 1 : 0) +
    (filters.priceMax !== undefined ? 1 : 0)

  const visibleBrands = showAllBrands ? facets.brands : facets.brands.slice(0, FACET_LIMITS.brands)
  const visibleTags = showAllTags ? facets.tags : facets.tags.slice(0, FACET_LIMITS.tags)

  return (
    <aside className={className}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-widest">Filter</h2>
        {activeFilterCount > 0 ? (
          <Button variant="ghost" size="sm" onClick={onClear} className="h-8 text-xs">
            Clear all
          </Button>
        ) : null}
      </div>

      {/* Availability */}
      {facets.availability.total > 0 ? (
        <FilterGroup title="Availability">
          <label className="flex cursor-pointer items-center justify-between gap-2 py-1.5 text-sm">
            <span className="flex items-center gap-2">
              <Checkbox
                checked={filters.inStock}
                onCheckedChange={checked => onChange({ ...filters, inStock: !!checked })}
              />
              <span>In stock</span>
            </span>
            <span className="text-xs text-muted-foreground">({facets.availability.inStock})</span>
          </label>
          <div className="flex items-center justify-between py-1.5 text-xs text-muted-foreground">
            <span>Out of stock</span>
            <span>({facets.availability.outOfStock})</span>
          </div>
        </FilterGroup>
      ) : null}

      {/* Price */}
      {facets.priceRange.max > 0 ? (
        <FilterGroup title="Price">
          <div className="px-1 pt-2">
            <Slider
              min={facets.priceRange.min}
              max={facets.priceRange.max}
              step={Math.max(1, Math.round((facets.priceRange.max - facets.priceRange.min) / 100))}
              value={priceRange}
              onValueChange={(value) => setPriceRange(value as [number, number])}
              onValueCommit={(value) => handlePriceCommit(value as [number, number])}
              className="mb-3"
            />
            <div className="flex items-center justify-between text-xs">
              <span className="rounded border border-border bg-card px-2 py-1">
                ₦{priceRange[0].toLocaleString()}
              </span>
              <span className="text-muted-foreground">—</span>
              <span className="rounded border border-border bg-card px-2 py-1">
                ₦{priceRange[1].toLocaleString()}
              </span>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Highest price: ₦{facets.priceRange.max.toLocaleString()}
            </p>
          </div>
        </FilterGroup>
      ) : null}

      {/* Brands */}
      {facets.brands.length > 0 ? (
        <FilterGroup title="Brand" activeCount={filters.brands.length}>
          <div className="space-y-1">
            {visibleBrands.map(({ value, count }) => (
              <label
                key={value}
                className="flex cursor-pointer items-center justify-between gap-2 py-1 text-sm"
              >
                <span className="flex items-center gap-2">
                  <Checkbox
                    checked={filters.brands.includes(value)}
                    onCheckedChange={() => toggleBrand(value)}
                  />
                  <span className="line-clamp-1">{value}</span>
                </span>
                <span className="text-xs text-muted-foreground">({count})</span>
              </label>
            ))}
          </div>
          {facets.brands.length > FACET_LIMITS.brands ? (
            <button
              type="button"
              onClick={() => setShowAllBrands(s => !s)}
              className="mt-2 text-xs font-medium text-primary hover:underline"
            >
              {showAllBrands ? '− Show less' : `+ Show ${facets.brands.length - FACET_LIMITS.brands} more`}
            </button>
          ) : null}
        </FilterGroup>
      ) : null}

      {/* Tags */}
      {visibleTags.length > 0 ? (
        <FilterGroup title="Tags" activeCount={filters.tags.length}>
          <div className="space-y-1">
            {visibleTags.map(({ value, count }) => (
              <label
                key={value}
                className="flex cursor-pointer items-center justify-between gap-2 py-1 text-sm"
              >
                <span className="flex items-center gap-2">
                  <Checkbox
                    checked={filters.tags.includes(value)}
                    onCheckedChange={() => toggleTag(value)}
                  />
                  <span className="line-clamp-1">{value}</span>
                </span>
                <span className="text-xs text-muted-foreground">({count})</span>
              </label>
            ))}
          </div>
          {facets.tags.length > FACET_LIMITS.tags ? (
            <button
              type="button"
              onClick={() => setShowAllTags(s => !s)}
              className="mt-2 text-xs font-medium text-primary hover:underline"
            >
              {showAllTags ? '− Show less' : `+ Show ${facets.tags.length - FACET_LIMITS.tags} more`}
            </button>
          ) : null}
        </FilterGroup>
      ) : null}
    </aside>
  )
}

function FilterGroup({
  title,
  activeCount = 0,
  children,
}: {
  title: string
  activeCount?: number
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(true)
  return (
    <div className="border-t border-border py-4 first:border-t-0 first:pt-0">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-bold uppercase tracking-wide">
          {title} {activeCount > 0 ? <span className="text-primary">({activeCount})</span> : null}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open ? <div className="mt-3">{children}</div> : null}
    </div>
  )
}

export function ActiveFilterChips({
  filters,
  facets,
  onRemove,
  onClear,
}: {
  filters: ActiveFilters
  facets: Facets | null
  onRemove: (key: keyof ActiveFilters, value?: string) => void
  onClear: () => void
}) {
  const chips: { key: keyof ActiveFilters; label: string; value?: string }[] = []
  for (const b of filters.brands) chips.push({ key: 'brands', label: b, value: b })
  for (const t of filters.tags) chips.push({ key: 'tags', label: t, value: t })
  if (filters.inStock) chips.push({ key: 'inStock', label: 'In stock' })
  if (filters.priceMin !== undefined) chips.push({ key: 'priceMin', label: `Min ₦${filters.priceMin.toLocaleString()}` })
  if (filters.priceMax !== undefined) chips.push({ key: 'priceMax', label: `Max ₦${filters.priceMax.toLocaleString()}` })

  if (chips.length === 0) return null

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground">Refined by:</span>
      {chips.map((chip, idx) => (
        <Badge key={`${chip.key}-${chip.value ?? idx}`} variant="secondary" className="gap-1 text-xs">
          {chip.label}
          <button
            type="button"
            onClick={() => onRemove(chip.key, chip.value)}
            aria-label={`Remove ${chip.label} filter`}
            className="ml-1"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <button type="button" onClick={onClear} className="text-xs text-primary hover:underline">
        Clear all
      </button>
    </div>
  )
}
