import { ProductCard } from './product-card'
import { ProductCardSkeleton } from './product-card-skeleton'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { cn } from '@/lib/utils'
import type { Product } from '@/lib/services/product.service'

interface ProductGridProps {
  products?: Product[]
  isLoading?: boolean
  skeletonCount?: number
  className?: string
  emptyMessage?: string
}

export function ProductGrid({
  products,
  isLoading,
  skeletonCount = 8,
  className,
  emptyMessage = 'No products found',
}: ProductGridProps) {
  const gridClass = cn(
    'grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4',
    className
  )

  if (isLoading) {
    return (
      <div className={gridClass}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!products || products.length === 0) {
    return (
      <Empty className="py-16">
        <EmptyHeader>
          <EmptyTitle>{emptyMessage}</EmptyTitle>
          <EmptyDescription>Try adjusting your filters or search terms.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className={cn(gridClass, 'stagger-children')}>
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          className="animate-fade-up"
        />
      ))}
    </div>
  )
}
