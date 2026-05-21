'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ImageIcon } from 'lucide-react'
import { categoryService, type Category } from '@/lib/services/category.service'

function orderCategories(categories: Category[]) {
  return [...categories].sort((a, b) => {
    const parentDelta = (a.parentId ? 1 : 0) - (b.parentId ? 1 : 0)
    if (parentDelta !== 0) return parentDelta
    const sortDelta = (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
    if (sortDelta !== 0) return sortDelta
    return a.name.localeCompare(b.name)
  })
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    categoryService.getFlat()
      .then(r => { if (Array.isArray(r)) setCategories(orderCategories(r as Category[])) })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-page-reveal">
      <div className="mb-10">
        <p className="text-xs font-mono uppercase tracking-widest text-primary mb-1">Browse by</p>
        <h1 className="text-3xl font-bold">All Categories</h1>
        <p className="text-muted-foreground mt-2">Find exactly what you&apos;re looking for across every active department.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-52 bg-muted animate-pulse rounded-xl" />)}
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
          <h2 className="text-lg font-semibold">No active categories yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">Add or activate categories from the admin catalog.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 stagger-children">
          {categories.map((cat, idx) => (
            <Link
              key={cat.id}
              href={`/shop?category=${cat.slug}`}
              className="animate-fade-up group overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-primary/40 hover:shadow-md"
            >
              <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                {cat.displayImage ? (
                  <Image
                    src={cat.displayImage}
                    alt={cat.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    unoptimized
                    priority={idx < 3}
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                    <ImageIcon className="h-8 w-8 opacity-45" />
                    <span className="text-xs font-medium">Image pending</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h2 className="font-bold group-hover:text-primary transition-colors">{cat.name}</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {(cat.productCount ?? 0).toLocaleString()} {(cat.productCount ?? 0) === 1 ? 'product' : 'products'}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
