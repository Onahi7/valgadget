'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { categoryService, type Category } from '@/lib/services/category.service'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    categoryService.getFlat()
      .then(r => { if (Array.isArray(r)) setCategories(r as any[]) })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-page-reveal">
      <div className="mb-10">
        <p className="text-xs font-mono uppercase tracking-widest text-primary mb-1">Browse by</p>
        <h1 className="text-3xl font-bold">All Categories</h1>
        <p className="text-muted-foreground mt-2">Find exactly what you&apos;re looking for.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-52 bg-muted animate-pulse rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
          {categories.map((cat, idx) => (
            <Link
              key={cat.id}
              href={`/shop?category=${cat.slug}`}
              className="animate-fade-up group bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 hover:shadow-md transition-all"
            >
              <div className="relative h-40 bg-muted overflow-hidden">
                {cat.image ? (
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    unoptimized
                    priority={idx < 3}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground/20 text-5xl font-bold font-mono">
                    —
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h2 className="font-bold group-hover:text-primary transition-colors">{cat.name}</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {cat.productCount} {cat.productCount === 1 ? 'product' : 'products'}
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
