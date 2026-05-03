import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface KpiCardProps {
  title: string
  value: string | number
  change?: number
  changePeriod?: string
  icon: LucideIcon
  iconClassName?: string
  className?: string
  prefix?: string
  suffix?: string
}

export function KpiCard({
  title, value, change, changePeriod = 'vs last month',
  icon: Icon, iconClassName, className, prefix = '', suffix = '',
}: KpiCardProps) {
  const isPositive = (change ?? 0) > 0
  const isNeutral = change === 0 || change === undefined
  const TrendIcon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown

  return (
    <div className={cn('bg-card rounded-lg border border-border p-6', className)}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
        <div className={cn('p-2 rounded-md bg-muted', iconClassName)}>
          <Icon className="w-4 h-4 text-foreground" />
        </div>
      </div>
      <p className="text-2xl font-bold tabular-nums">
        {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
      </p>
      {change !== undefined && (
        <div className={cn(
          'flex items-center gap-1 mt-2 text-xs font-medium',
          isNeutral ? 'text-muted-foreground' : isPositive ? 'text-green-600' : 'text-destructive'
        )}>
          <TrendIcon className="w-3.5 h-3.5" />
          <span>{isPositive ? '+' : ''}{change}%</span>
          <span className="text-muted-foreground font-normal">{changePeriod}</span>
        </div>
      )}
    </div>
  )
}
