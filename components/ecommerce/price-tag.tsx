import { cn } from '@/lib/utils'

interface PriceTagProps {
  price: number
  comparePrice?: number
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function PriceTag({ price, comparePrice, className, size = 'md' }: PriceTagProps) {
  const sizeMap = {
    sm: { price: 'text-base font-bold', compare: 'text-xs', badge: 'text-[10px] px-1.5 py-0.5' },
    md: { price: 'text-xl font-bold', compare: 'text-sm', badge: 'text-xs px-2 py-0.5' },
    lg: { price: 'text-3xl font-bold', compare: 'text-base', badge: 'text-sm px-2.5 py-1' },
  }
  const s = sizeMap[size]
  const discount = comparePrice
    ? Math.round(((comparePrice - price) / comparePrice) * 100)
    : null

  return (
    <div className={cn('flex items-baseline gap-2 flex-wrap', className)}>
      <span className={cn(s.price, 'text-foreground')}>₦{price.toLocaleString()}</span>
      {comparePrice && (
        <span className={cn(s.compare, 'text-muted-foreground line-through')}>
          ₦{comparePrice.toLocaleString()}
        </span>
      )}
      {discount && (
        <span className={cn('rounded font-mono font-bold bg-primary/10 text-primary', s.badge)}>
          -{discount}%
        </span>
      )}
    </div>
  )
}
