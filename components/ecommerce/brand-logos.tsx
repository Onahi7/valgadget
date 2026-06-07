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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {brands.map(brand => (
            <Link
              key={brand.slug}
              href={`/shop?brand=${brand.slug}`}
              className="group flex h-24 items-center justify-center rounded-lg border border-border bg-card px-4 transition-all hover:border-primary/40 hover:shadow-md"
            >
              <BrandWordmark name={brand.name} />
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

/**
 * Styled brand wordmark — renders brand name with typographic
 * variation to feel like a logo, not plain text. Uses uppercase,
 * tight tracking, bold weight, and a small "underline" accent.
 */
function BrandWordmark({ name }: { name: string }) {
  // Generate a small visual accent that varies by brand name length
  const accentChar = name.charAt(0).toUpperCase()
  const rest = name.slice(1)

  return (
    <div className="flex items-baseline gap-0.5 transition-transform group-hover:scale-105">
      <span className="text-2xl font-black tracking-tight text-foreground group-hover:text-primary">
        {accentChar}
      </span>
      <span className="text-sm font-semibold uppercase tracking-wide text-foreground/80 group-hover:text-primary/80">
        {rest}
      </span>
    </div>
  )
}
