import Image from 'next/image'
import Link from 'next/link'

export interface CategoryIcon {
  slug: string
  name: string
  image: string
  href: string
}

interface CategoryIconGridProps {
  title?: string
  categories: CategoryIcon[]
  className?: string
}

/**
 * Tech Direct-style category icon grid: each item is a circular/rounded
 * image with a label below. Used in the "SHOP BY CATEGORIES" band on the
 * homepage.
 */
export function CategoryIconGrid({
  title = 'Shop by Categories',
  categories,
  className = '',
}: CategoryIconGridProps) {
  if (categories.length === 0) return null

  return (
    <section className={`border-t border-border py-10 sm:py-12 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-6 text-center text-sm font-bold uppercase tracking-widest text-foreground sm:text-base">
          {title}
        </h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 md:grid-cols-6 lg:grid-cols-8">
          {categories.map(cat => (
            <Link
              key={cat.slug}
              href={cat.href}
              className="group flex flex-col items-center gap-2 text-center"
            >
              <div className="relative aspect-square w-full max-w-[120px] overflow-hidden rounded-full border border-border bg-muted transition-all group-hover:border-foreground">
                {cat.image ? (
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    sizes="120px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    unoptimized
                  />
                ) : null}
              </div>
              <span className="line-clamp-2 text-xs font-medium text-foreground sm:text-sm">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
