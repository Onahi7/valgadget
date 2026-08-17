'use client'

import { useState, useEffect } from 'react'
import { Star, CheckCircle, XCircle, Trash2, MessageSquare, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { getToken } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface Review {
  id: string
  rating: number
  title?: string
  body: string
  reply?: string | null
  repliedAt?: string | null
  verified: boolean
  isActive: boolean
  createdAt: string
  product: {
    id: string
    name: string
    slug: string
  }
  user: {
    id: string
    name: string
  }
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [search, setSearch] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')

  useEffect(() => {
    loadReviews()
  }, [])

  const loadReviews = async () => {
    try {
      const res = await fetch('/api/admin/reviews', {
        headers: { Authorization: `Bearer ${getToken()}` },
        credentials: 'include',
      })
      const data = await res.json()
      if (data.data) setReviews(data.data)
    } catch (err) {
      toast.error('Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        credentials: 'include',
        body: JSON.stringify({ isActive: !isActive }),
      })

      if (res.ok) {
        toast.success(isActive ? 'Review hidden' : 'Review approved')
        loadReviews()
      } else {
        toast.error('Failed to update review')
      }
    } catch (err) {
      toast.error('Failed to update review')
    }
  }

  const deleteReview = async (id: string) => {
    if (!confirm('Delete this review permanently?')) return

    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
        credentials: 'include',
      })

      if (res.ok) {
        toast.success('Review deleted')
        loadReviews()
      } else {
        toast.error('Failed to delete review')
      }
    } catch (err) {
      toast.error('Failed to delete review')
    }
  }

  const submitReply = async (id: string) => {
    if (!replyText.trim()) return
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        credentials: 'include',
        body: JSON.stringify({ reply: replyText.trim() }),
      })
      if (res.ok) {
        toast.success('Reply sent')
        setReplyingTo(null)
        setReplyText('')
        loadReviews()
      } else {
        toast.error('Failed to send reply')
      }
    } catch {
      toast.error('Failed to send reply')
    }
  }

  const filteredReviews = reviews.filter(review => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'active' && review.isActive) ||
      (filter === 'inactive' && !review.isActive)

    const matchesSearch =
      search === '' ||
      review.product.name.toLowerCase().includes(search.toLowerCase()) ||
      review.user.name.toLowerCase().includes(search.toLowerCase()) ||
      review.body.toLowerCase().includes(search.toLowerCase())

    return matchesFilter && matchesSearch
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-page-reveal">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reviews</h1>
        <p className="text-muted-foreground text-sm mt-1">Moderate and approve customer reviews</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Input
          placeholder="Search reviews..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reviews</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Hidden</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Reviews</p>
          <p className="text-2xl font-bold">{reviews.length}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Active</p>
          <p className="text-2xl font-bold text-green-600">
            {reviews.filter(r => r.isActive).length}
          </p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Hidden</p>
          <p className="text-2xl font-bold text-amber-600">
            {reviews.filter(r => !r.isActive).length}
          </p>
        </div>
      </div>

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <div className="text-center py-12 bg-card border rounded-lg">
          <p className="text-muted-foreground">No reviews found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map(review => (
            <div key={review.id} className="bg-card border rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
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
                    {review.verified && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Verified
                      </Badge>
                    )}
                    <Badge variant={review.isActive ? 'default' : 'secondary'}>
                      {review.isActive ? 'Active' : 'Hidden'}
                    </Badge>
                  </div>
                  <Link
                    href={`/products/${review.product.slug}`}
                    className="font-semibold hover:text-primary transition-colors"
                  >
                    {review.product.name}
                  </Link>
                  <p className="text-sm text-muted-foreground mt-1">
                    By {review.user.name} on{' '}
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleActive(review.id, review.isActive)}
                  >
                    {review.isActive ? (
                      <><XCircle className="w-4 h-4 mr-2" /> Hide</>
                    ) : (
                      <><CheckCircle className="w-4 h-4 mr-2" /> Approve</>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteReview(review.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {review.title && (
                <h4 className="font-semibold mb-2">{review.title}</h4>
              )}
              <p className="text-muted-foreground whitespace-pre-wrap">{review.body}</p>

              {/* Reply section */}
              {review.reply && replyingTo !== review.id ? (
                <div className="mt-3 bg-primary/5 border border-primary/10 rounded-lg p-3">
                  <p className="text-xs font-medium text-primary flex items-center gap-1.5 mb-1">
                    <MessageSquare className="w-3 h-3" /> Admin Reply
                    {review.repliedAt && <span className="text-muted-foreground ml-1">· {new Date(review.repliedAt).toLocaleDateString()}</span>}
                  </p>
                  <p className="text-sm">{review.reply}</p>
                </div>
              ) : null}

              {replyingTo === review.id ? (
                <div className="mt-3 space-y-2">
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Write a reply..."
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button size="sm" className="gap-1.5" onClick={() => submitReply(review.id)} disabled={!replyText.trim()}>
                      <Send className="w-3.5 h-3.5" /> {review.reply ? 'Update Reply' : 'Send Reply'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setReplyingTo(null); setReplyText('') }}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs"
                    onClick={() => { setReplyingTo(review.id); setReplyText(review.reply ?? '') }}
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> {review.reply ? 'Edit Reply' : 'Reply'}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
