import { Truck, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Product } from '@/lib/services/product.service'

interface FulfillmentBadgeProps {
  product: Product
  className?: string
}

/**
 * Industry-standard fulfillment trust badge shown on product cards.
 * Renders nothing if no badge conditions are met.
 */
export function FulfillmentBadge({ product, className }: FulfillmentBadgeProps) {
  if (product.stock <= 0) return null

  // High stock + free delivery threshold
  if (product.stock <= 5) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 dark:text-amber-400 sm:text-[11px]',
          className
        )}
      >
        <Zap className="h-3 w-3" />
        Only {product.stock} left
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-400 sm:text-[11px]',
        className
      )}
    >
      <Truck className="h-3 w-3" />
      Free delivery
    </span>
  )
}
