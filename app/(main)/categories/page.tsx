'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ChevronRight } from 'lucide-react'
import { useCategoryNavigation } from '@/hooks/use-category-navigation'
import { categoryIsAvailable } from '@/lib/category-navigation'

export default function CategoriesPage() {
  const { groups: parentGroups, loading } = useCategoryNavigation()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-page-reveal">
      <div className="mb-10">
        <h1 className="text-3xl font-bold">Categories</h1>
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
              {categoryIsAvailable(parent) ? (
                <Link href={`/categories/${parent.slug}`} className="group block">
                  {parent.displayImage ? (
                    <div className="relative h-36 overflow-hidden bg-muted">
                      <Image
                        src={parent.displayImage}
                        alt={parent.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
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
              ) : (
                <div aria-disabled="true" className="opacity-65">
                {parent.displayImage ? (
                  <div className="relative h-36 overflow-hidden bg-muted">
                    <Image
                      src={parent.displayImage}
                      alt={parent.name}
                      fill
                      className="object-cover grayscale"
                      unoptimized
                    />
                  </div>
                ) : null}
                <div className="border-t border-border p-4">
                  <h2 className="text-lg font-bold text-foreground">{parent.name}</h2>
                  <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Coming soon</p>
                </div>
                </div>
              )}

              {children.length > 0 ? (
                <ul className="divide-y divide-border">
                  {children.slice(0, 6).map(child => (
                    <li key={child.id}>
                      {categoryIsAvailable(child) ? (
                        <Link href={`/categories/${child.slug}`} className="group flex items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-accent">
                          <span className="text-foreground group-hover:text-primary">{child.name}</span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
                        </Link>
                      ) : (
                        <div className="flex items-center justify-between px-4 py-2.5 text-sm text-muted-foreground" aria-disabled="true">
                          <span>{child.name}</span>
                          <span className="text-[10px] font-bold uppercase">Soon</span>
                        </div>
                      )}
                    </li>
                  ))}
                  {children.length > 6 ? (
                    <li>
                      <Link
                        href={`/categories/${parent.slug}`}
                        className="flex items-center gap-1 px-4 py-2.5 text-xs font-medium text-primary hover:underline"
                      >
                        View all {children.length} subcategories
                        <ArrowRight className="h-3 w-3" aria-hidden="true" />
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
