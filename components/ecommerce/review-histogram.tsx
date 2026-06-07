import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReviewSummary {
  average: number
  count: number
  // Map of rating value (1-5) to count
  distribution: Record<1 | 2 | 3 | 4 | 5, number>
}

interface ReviewHistogramProps {
  summary: ReviewSummary
}

/**
 * Star rating histogram for product reviews.
 * Shows average, total count, and bar-chart distribution per star level.
 */
export function ReviewHistogram({ summary }: ReviewHistogramProps) {
  const { average, count, distribution } = summary

  return (
    <div className="grid gap-6 sm:grid-cols-[1fr_2fr]">
      {/* Left — average + stars */}
      <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card p-6 text-center">
        <p className="text-5xl font-bold tracking-tight">{average.toFixed(1)}</p>
        <div className="mt-2 flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map(value => (
            <Star
              key={value}
              className={cn(
                'h-5 w-5',
                value <= Math.round(average)
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-muted-foreground/30'
              )}
            />
          ))}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Based on {count} {count === 1 ? 'review' : 'reviews'}
        </p>
      </div>

      {/* Right — distribution bars */}
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map(stars => {
          const num = distribution[stars as 1 | 2 | 3 | 4 | 5] ?? 0
          const pct = count > 0 ? (num / count) * 100 : 0
          return (
            <div key={stars} className="flex items-center gap-3 text-sm">
              <div className="flex w-12 shrink-0 items-center gap-1">
                <span className="font-medium">{stars}</span>
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              </div>
              <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="absolute inset-y-0 left-0 bg-amber-400 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-10 shrink-0 text-right text-xs text-muted-foreground">{num}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
