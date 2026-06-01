import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ProductCard } from '@/components/ecommerce/product-card'
import type { Product } from '@/lib/services/product.service'

export interface SubcategoryLink {
  label: string
  href: string
  image?: string
}

interface SectionCoverProps {
  title: string
  coverImage: string
  viewAllHref: string
  products: Product[]
  subcategories?: SubcategoryLink[]
}

/**
 * Tech Direct-style section cover: bold title above a full-bleed
 * photographic banner, followed by a product row and 3 subcategory
 * mini-cards.
 */
export function SectionCover({
  title,
  coverImage,
  viewAllHref,
  products,
  subcategories = [],
}: SectionCoverProps) {
  if (products.length === 0) return null

  return (
    <section className="border-t border-border py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
          <Link
            href={viewAllHref}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            View All Categories
            <ArrowRight className="ml-1 inline-block h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Full-bleed cover image — title sits above, not overlaid */}
        <div className="relative mb-8 aspect-[21/9] w-full overflow-hidden rounded-lg bg-muted">
          <Image
            src={coverImage}
            alt={title}
            fill
            sizes="(max-width: 1024px) 100vw, 1280px"
            className="object-cover"
            unoptimized
          />
        </div>

        {/* Product row */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {products.slice(0, 6).map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Subcategory mini-cards */}
        {subcategories.length > 0 && (
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {subcategories.slice(0, 3).map(sub => (
              <Link
                key={sub.label}
                href={sub.href}
                className="group relative overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md"
              >
                {sub.image ? (
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                    <Image
                      src={sub.image}
                      alt={sub.label}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      unoptimized
                    />
                  </div>
                ) : null}
                <div className="p-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">
                    {sub.label}
                  </h3>
                  <span className="mt-2 inline-flex items-center text-sm font-medium text-muted-foreground group-hover:text-foreground">
                    Shop Now
                    <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
