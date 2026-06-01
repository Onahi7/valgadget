import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface Brand {
  name: string
  slug: string
}

interface BrandLogosProps {
  brands: Brand[]
  className?: string
}

/**
 * Tech Direct-style brand logo section: displays brand names in a grid
 * with links to filtered shop pages.
 */
export function BrandLogos({ brands, className = '' }: BrandLogosProps) {
  if (brands.length === 0) return null

  return (
    <section className={`border-t border-border bg-background py-10 sm:py-12 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold">Our Top Brands</h2>
          <Link
            href="/shop"
            className="shrink-0 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            View All
            <ArrowRight className="ml-1 inline-block h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {brands.map(brand => (
            <Link
              key={brand.slug}
              href={`/shop?brand=${brand.slug}`}
              className="flex items-center justify-center rounded-lg border border-border bg-card p-6 transition-all hover:border-primary/40 hover:shadow-md"
            >
              <span className="text-sm font-semibold text-foreground">{brand.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
