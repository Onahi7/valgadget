'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { ProductGrid } from '@/components/ecommerce/product-grid'
import { ProductCardSkeleton } from '@/components/ecommerce/product-card-skeleton'
import { type Category } from '@/lib/services/category.service'
import { productService, type Product, type ProductsResponse } from '@/lib/services/product.service'

interface CategoryDetailClientProps {
  slug: string
  initialCategory: Category | null
}

export function CategoryDetailClient({ slug, initialCategory }: CategoryDetailClientProps) {
  const [category] = useState<Category | null>(initialCategory)
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-page-reveal">
      <Breadcrumbs
        className="mb-8"
        items={[
          { label: 'Categories', href: '/categories' },
          { label: category.name },
        ]}
      />
      <div className="mb-8">
        <p className="text-xs font-mono uppercase tracking-widest text-primary mb-1">
          {products.length} products
        </p>
        <h1 className="text-3xl font-bold">{category.name}</h1>
        {category.description && (
          <p className="text-muted-foreground mt-2">{category.description}</p>
        )}
      </div>
      <ProductGrid
        products={products}
        emptyMessage={`No products in ${category.name} yet`}
      />
    </div>
  )
}
