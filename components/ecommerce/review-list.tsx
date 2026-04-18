'use client'

import { Star, CheckCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface Review {
  id: string
  rating: number
  title?: string
  body: string
  verified: boolean
  createdAt: string
  user: {
    id: string
    name: string
    avatar?: string
  }
}

interface ReviewListProps {
  reviews: Review[]
  emptyMessage?: string
}

export function ReviewList({ reviews, emptyMessage = 'No reviews yet' }: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {reviews.map(review => (
        <div key={review.id} className="border-b pb-6 last:border-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                {review.user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold">{review.user.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  {/* Stars */}
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(value => (
                      <Star
                        key={value}
                        className={cn(
                          'w-4 h-4',
                          value <= review.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-muted-foreground'
                        )}
                      />
                    ))}
                  </div>
                  {/* Verified Badge */}
                  {review.verified && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Verified Purchase
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            {/* Date */}
            <span className="text-sm text-muted-foreground">
              {new Date(review.createdAt).toLocaleDateString('en-NG', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>

          {/* Content */}
          <div className="ml-13">
            {review.title && (
              <h4 className="font-semibold mb-2">{review.title}</h4>
            )}
            <p className="text-muted-foreground whitespace-pre-wrap">{review.body}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// Star Rating Display Component
export function StarRating({ rating, showCount, count }: { rating: number; showCount?: boolean; count?: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(value => (
          <Star
            key={value}
            className={cn(
              'w-4 h-4',
              value <= rating
                ? 'fill-amber-400 text-amber-400'
                : 'text-muted-foreground'
            )}
          />
        ))}
      </div>
      <span className="text-sm font-medium">{rating.toFixed(1)}</span>
      {showCount && count !== undefined && (
        <span className="text-sm text-muted-foreground">({count})</span>
      )}
    </div>
  )
}
