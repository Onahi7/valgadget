import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ProductCard } from '@/components/ecommerce/product-card'
import type { Product } from '@/lib/services/product.service'

interface ProductShelfProps {
  title: string
  href: string
  products: Product[]
  /** Override default 4-col grid (e.g., 3 for featured, 8 for top sellers) */
  columns?: 3 | 4 | 5 | 6 | 8
  showHeader?: boolean
  className?: string
  compact?: boolean
}

/**
 * Tech Direct-style product shelf: bold left-aligned title, "View all" link
 * on the right, product grid below. Used 3-4 times on the homepage as part
 * of the rhythmic repetition.
 */
export function ProductShelf({
  title,
  href,
  products,
  columns = 4,
  showHeader = true,
  className = '',
  compact = false,
}: ProductShelfProps) {
  if (products.length === 0) return null

  const colsClass = {
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
    8: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
  }[columns]

  return (
    <section className={`border-t border-border ${compact ? 'py-5 sm:py-7' : 'py-10 sm:py-12'} ${className || 'bg-background'}`}>
      <div className="mx-auto max-w-[1440px] px-3 sm:px-6 lg:px-8">
        {showHeader && (
          <div className={`${compact ? 'mb-3' : 'mb-5'} flex items-end justify-between gap-4`}>
            <h2 className={compact ? 'text-xl font-bold sm:text-2xl' : 'text-2xl font-bold'}>{title}</h2>
            <Link
              href={href}
              className="shrink-0 text-sm font-semibold text-slate-teal transition-colors hover:text-primary"
            >
              View All
              <ArrowRight className="ml-1 inline-block h-3.5 w-3.5" />
            </Link>
          </div>
        )}
        <div className={`grid gap-4 ${colsClass}`}>
          {products.map(product => (
            <ProductCard key={product.id} product={product} compact={compact} />
          ))}
        </div>
      </div>
    </section>
  )
}
