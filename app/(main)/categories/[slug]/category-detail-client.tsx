'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { ProductGrid } from '@/components/ecommerce/product-grid'
import { ProductCardSkeleton } from '@/components/ecommerce/product-card-skeleton'
import { type Category } from '@/lib/services/category.service'
import { productService, type Product, type ProductsResponse } from '@/lib/services/product.service'

interface SubcategorySummary {
  id: string
  name: string
  slug: string
  image?: string | null
}

interface CategoryDetailClientProps {
  slug: string
  initialCategory: (Category & { coverImage?: string }) | null
  subcategories: SubcategorySummary[]
}

export function CategoryDetailClient({ slug, initialCategory, subcategories }: CategoryDetailClientProps) {
  const [category] = useState<(Category & { coverImage?: string }) | null>(initialCategory)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    productService
      .getAll({ category: slug, limit: 50 })
      .then((response) => {
        const prods = response as ProductsResponse
        if (prods?.data) setProducts(prods.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-16">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (!category) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Category Not Found</h1>
        <Link href="/categories" className="text-primary hover:underline">
          Browse all categories
        </Link>
      </div>
    )
  }

  const coverImage = category.coverImage || category.image

  return (
    <div className="animate-page-reveal">
      {/* Tech Direct-style full-bleed cover */}
      {coverImage ? (
        <section className="relative h-64 w-full overflow-hidden bg-muted sm:h-80 lg:h-96">
          <Image
            src={coverImage}
            alt={category.name}
            fill
            sizes="100vw"
            className="object-cover"
            unoptimized
            priority
          />
        </section>
      ) : null}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs
          className="mb-6"
          items={[
            { label: 'Categories', href: '/categories' },
            { label: category.name },
          ]}
        />

        <div className="mb-8">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
            {products.length} {products.length === 1 ? 'product' : 'products'}
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{category.name}</h1>
          {category.description ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{category.description}</p>
          ) : null}
        </div>

        {/* Subcategory cards (Tech Direct pattern) */}
        {subcategories.length > 0 ? (
          <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {subcategories.map(sub => (
              <Link
                key={sub.id}
                href={`/categories/${sub.slug}`}
                className="group flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-shadow hover:shadow-md"
              >
                {sub.image ? (
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                    <Image
                      src={sub.image}
                      alt={sub.name}
                      fill
                      sizes="48px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="h-12 w-12 shrink-0 rounded-md bg-muted" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-medium text-foreground">{sub.name}</p>
                  <p className="mt-0.5 inline-flex items-center text-xs text-muted-foreground group-hover:text-foreground">
                    Browse
                    <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : null}

        <ProductGrid
          products={products}
          emptyMessage={`No products in ${category.name} yet`}
        />
      </div>
    </div>
  )
}
