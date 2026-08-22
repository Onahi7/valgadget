'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Heart, ShoppingCart, Star, Eye, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCart } from '@/contexts/cart-context'
import { useWishlist } from '@/contexts/wishlist-context'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { Product } from '@/lib/services/product.service'
import { FulfillmentBadge } from '@/components/ecommerce/fulfillment-badge'
import { toCartItem, toWishlistItem } from '@/lib/cart-helpers'

interface ProductCardProps {
  product: Product
  className?: string
  priority?: boolean
}

export function ProductCard({ product, className, priority = false }: ProductCardProps) {
  const { addToCart } = useCart()
  const { toggle, has } = useWishlist()
  const isWishlisted = has(product.id)
  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : null
  const validImages = product.images.filter(src => src?.startsWith('/') || src?.includes('ik.imagekit.io'))
  const imageSrc = validImages[0] ?? '/placeholder-product.svg'
  const hoverImage = validImages[1] ?? null
  const [adding, setAdding] = useState(false)
  const [justAdded, setJustAdded] = useState(false)

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (product.stock <= 0 || adding) return
    setAdding(true)
    addToCart(toCartItem(product))
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 1500)
    setTimeout(() => setAdding(false), 600)
    toast.success('Added to cart', { description: product.name })
  }

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggle(toWishlistItem(product))
    toast(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist')
  }

  return (
    <article
      className={cn(
        'group relative flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card',
        'transition-all duration-200 hover:border-primary/40 hover:shadow-lg',
        className
      )}
    >
      {/* Badges */}
      <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
        {product.stock <= 0 && (
          <Badge variant="secondary" className="border-0 bg-muted font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Sold out
          </Badge>
        )}
        {product.isNew && product.stock > 0 && (
          <Badge className="border-0 bg-primary font-mono text-[10px] uppercase tracking-wider text-primary-foreground">
            New
          </Badge>
        )}
        {discount && (
          <Badge variant="secondary" className="border-0 bg-tangerine font-mono text-[10px] uppercase tracking-wider text-tangerine-foreground">
            -{discount}%
          </Badge>
        )}
      </div>

      {/* Quick actions - top right */}
      <div className="absolute right-2 top-2 z-10 flex flex-col gap-1.5 sm:right-3 sm:top-3">
        <button
          onClick={handleWishlist}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-full bg-background/85 backdrop-blur-sm transition-all duration-200 hover:scale-110',
            'opacity-0 group-hover:opacity-100',
            isWishlisted && 'opacity-100'
          )}
        >
          <Heart className={cn('h-4 w-4', isWishlisted && 'fill-destructive text-destructive')} />
        </button>
        <Link
          href={`/products/${product.slug}`}
          aria-label="View product"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-background/85 opacity-0 backdrop-blur-sm transition-all duration-200 hover:scale-110 group-hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <Eye className="h-4 w-4" />
        </Link>
      </div>

      {/* Image with hover swap */}
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-square w-full overflow-hidden bg-white"
      >
        <Image
          src={imageSrc}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={cn(
            'object-contain p-3 transition-all duration-500 sm:p-4',
            hoverImage ? 'group-hover:opacity-0' : 'group-hover:scale-[1.03]'
          )}
          priority={priority}
          unoptimized
        />
        {hoverImage && (
          <Image
            src={hoverImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-3 opacity-0 transition-all duration-500 group-hover:scale-[1.03] group-hover:opacity-100 sm:p-4"
            unoptimized
          />
        )}
      </Link>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-4">
        {product.brand && (
          <p className="line-clamp-1 text-[10px] text-muted-foreground sm:text-[11px]">
            {product.brand}
          </p>
        )}
        <Link href={`/products/${product.slug}`} className="mt-1 block">
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-primary sm:min-h-[2.625rem] sm:text-[15px]">
            {product.name}
          </h3>
        </Link>

        {/* Rating + Fulfillment row */}
        <div className="mt-2 flex items-center justify-between gap-2">
          {product.reviewCount > 0 ? (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5" aria-label={`Rating: ${product.rating} out of 5`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'h-3 w-3',
                      i < Math.round(product.rating)
                        ? 'fill-primary text-primary'
                        : 'text-muted-foreground/30'
                    )}
                  />
                ))}
              </div>
              <span className="text-[11px] text-muted-foreground">({product.reviewCount})</span>
            </div>
          ) : <span />}
          <FulfillmentBadge product={product} />
        </div>

        {/* Price + Add to cart */}
        <div className="mt-auto flex flex-col gap-2 pt-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <span className="block break-words text-base font-bold leading-tight tracking-tight text-tangerine sm:text-lg">
              ₦{product.price.toLocaleString('en-NG')}
            </span>
            {product.comparePrice && (
              <span className="block text-xs text-muted-foreground line-through">
                ₦{product.comparePrice.toLocaleString('en-NG')}
              </span>
            )}
          </div>
          <Button
            size="sm"
            onClick={handleAddToCart}
            disabled={product.stock <= 0 || adding}
            className={cn(
              'h-8 w-full shrink-0 px-3 text-xs transition-all sm:w-auto',
              justAdded
                ? 'bg-emerald-600 text-white hover:bg-emerald-600'
                : 'bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground'
            )}
          >
            {justAdded ? (
              <>
                <Check className="mr-1 h-3.5 w-3.5" />
                Added
              </>
            ) : product.stock <= 0 ? (
              'Sold out'
            ) : (
              <>
                <ShoppingCart className="mr-1 h-3.5 w-3.5" aria-hidden />
                Add
              </>
            )}
          </Button>
        </div>
      </div>
    </article>
  )
}
