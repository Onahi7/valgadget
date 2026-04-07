'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { ProductGrid } from '@/components/ecommerce/product-grid'
import { ProductCardSkeleton } from '@/components/ecommerce/product-card-skeleton'
import { categoryService, type Category } from '@/lib/services/category.service'
import { productService, type Product } from '@/lib/services/product.service'

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [category, setCategory] = useState<Category | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading]   = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    Promise.all([
      categoryService.getBySlug(slug),
      productService.getAll({ category: slug, limit: 50 }),
    ]).then(([catRes, prodRes]) => {
      if (!catRes.success || !catRes.data) { setNotFound(true); return }
      setCategory(catRes.data)
      if (prodRes.success && prodRes.data) setProducts(prodRes.data.data)
    }).finally(() => setLoading(false))
  }, [slug])

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-16">
        {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
      </div>
    </div>
  )

  if (notFound || !category) return (
    <div className="max-w-7xl mx-auto px-4 py-20 text-center">
      <h1 className="text-2xl font-bold mb-4">Category Not Found</h1>
      <Link href="/categories" className="text-primary hover:underline">Browse all categories</Link>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-page-reveal">
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-8" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/categories" className="hover:text-foreground">Categories</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium">{category.name}</span>
      </nav>
      <div className="mb-8">
        <p className="text-xs font-mono uppercase tracking-widest text-primary mb-1">{products.length} products</p>
        <h1 className="text-3xl font-bold">{category.name}</h1>
        {category.description && <p className="text-muted-foreground mt-2">{category.description}</p>}
      </div>
      <ProductGrid products={products} emptyMessage={`No products in ${category.name} yet`} />
    </div>
  )
}
