'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ChevronRight } from 'lucide-react'
import { categoryService, type Category } from '@/lib/services/category.service'

interface ParentWithChildren {
  parent: Category
  children: Category[]
}

export default function CategoriesPage() {
  const [allCategories, setAllCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    categoryService
      .getFlat()
      .then(r => {
        if (Array.isArray(r)) setAllCategories(r as Category[])
      })
      .finally(() => setLoading(false))
  }, [])

  // Group subcategories under their parent; show only top-level parents in the sidebar
  const parentGroups: ParentWithChildren[] = useMemo(() => {
    const parents = allCategories.filter(c => !c.parentId)
    return parents
      .map(parent => ({
        parent,
        children: allCategories
          .filter(c => c.parentId === parent.id)
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
      }))
      .sort((a, b) => (a.parent.sortOrder ?? 0) - (b.parent.sortOrder ?? 0))
  }, [allCategories])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-page-reveal">
      <div className="mb-10">
        <p className="text-xs font-mono uppercase tracking-widest text-primary mb-1">Browse by</p>
        <h1 className="text-3xl font-bold">All Categories</h1>
        <p className="text-muted-foreground mt-2">Find exactly what you&apos;re looking for.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 stagger-children md:grid-cols-2 lg:grid-cols-3">
          {parentGroups.map(({ parent, children }, groupIndex) => (
            <div
              key={parent.id}
              className="animate-fade-up overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/40 hover:shadow-md"
            >
              <Link
                href={`/categories/${parent.slug}`}
                className="group block"
              >
                {parent.displayImage ? (
                  <div className="relative h-36 overflow-hidden bg-muted">
                    <Image
                      src={parent.displayImage}
                      alt={parent.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      priority={groupIndex === 0}
                      unoptimized
                    />
                  </div>
                ) : null}
                <div className="border-t border-border p-4">
                  <h2 className="text-lg font-bold text-foreground">{parent.name}</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {parent.productCount ?? 0} {parent.productCount === 1 ? 'product' : 'products'}
                  </p>
                </div>
              </Link>

              {children.length > 0 ? (
                <ul className="divide-y divide-border">
                  {children.slice(0, 6).map(child => (
                    <li key={child.id}>
                      <Link
                        href={`/categories/${child.slug}`}
                        className="group flex items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-accent"
                      >
                        <span className="text-foreground group-hover:text-primary">{child.name}</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      </Link>
                    </li>
                  ))}
                  {children.length > 6 ? (
                    <li>
                      <Link
                        href={`/categories/${parent.slug}`}
                        className="flex items-center gap-1 px-4 py-2.5 text-xs font-medium text-primary hover:underline"
                      >
                        View all {children.length} subcategories
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </li>
                  ) : null}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
