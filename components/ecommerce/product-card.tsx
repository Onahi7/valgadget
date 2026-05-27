'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Heart, ShoppingCart, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCart } from '@/contexts/cart-context'
import { useWishlist } from '@/contexts/wishlist-context'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { Product } from '@/lib/services/product.service'

interface ProductCardProps {
  product: Product
  className?: string
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { addToCart } = useCart()
  const { toggle, has } = useWishlist()
  const isWishlisted = has(product.id)
  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : null
  const imageSrc = product.images.find(src => !src.includes('source.unsplash.com')) ?? '/placeholder-product.svg'

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addToCart({
      id: product.id, name: product.name, slug: product.slug,
      images: product.images, price: product.price, sku: product.sku,
    })
    toast.success('Added to cart', { description: product.name })
  }

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggle({
      id: product.id, name: product.name, slug: product.slug,
      images: product.images, price: product.price, comparePrice: product.comparePrice,
      stock: product.stock, sku: product.sku,
    })
    toast(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist')
  }

  return (
    <article
      className={cn(
        'group relative flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card',
        'hover:border-primary/40 hover:shadow-lg transition-all duration-200',
        className
      )}
    >
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
        {product.isNew && (
          <Badge className="text-[10px] font-mono uppercase tracking-wider bg-primary text-primary-foreground border-0">
            New
          </Badge>
        )}
        {discount && (
          <Badge variant="secondary" className="text-[10px] font-mono uppercase tracking-wider border-0">
            -{discount}%
          </Badge>
        )}
      </div>

      {/* Wishlist */}
      <button
        onClick={handleWishlist}
        aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        className={cn(
          'absolute top-2 right-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-background/85 backdrop-blur-sm sm:top-3 sm:right-3',
          'opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110',
          isWishlisted && 'opacity-100 text-destructive'
        )}
      >
        <Heart className={cn('w-4 h-4', isWishlisted && 'fill-current text-destructive')} />
      </button>

      {/* Image */}
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-square w-full overflow-hidden bg-white"
      >
        <Image
          src={imageSrc}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-contain p-3 transition-transform duration-300 group-hover:scale-[1.03] sm:p-4"
          unoptimized
        />
      </Link>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-4">
        {product.category && (
          <Link
            href={`/categories/${product.category.slug}`}
            className="line-clamp-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary sm:text-[11px]"
          >
            {product.category.name}
          </Link>
        )}
        <Link href={`/products/${product.slug}`} className="block mt-1">
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary sm:min-h-[2.625rem] sm:text-[15px]">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        {product.reviewCount > 0 && (
          <div className="flex items-center gap-1.5 mt-2">
            <div className="flex items-center gap-0.5" aria-label={`Rating: ${product.rating} out of 5`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    'w-3 h-3',
                    i < Math.round(product.rating)
                      ? 'fill-primary text-primary'
                      : 'text-muted-foreground/30'
                  )}
                />
              ))}
            </div>
            <span className="text-[11px] text-muted-foreground">({product.reviewCount})</span>
          </div>
        )}

        {/* Price + Add to cart */}
        <div className="mt-auto flex flex-col gap-2 pt-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <span className="block break-words text-sm font-bold leading-tight text-foreground sm:text-base">
              ₦{product.price.toLocaleString()}
            </span>
            {product.comparePrice && (
              <span className="block text-xs text-muted-foreground line-through">
                ₦{product.comparePrice.toLocaleString()}
              </span>
            )}
          </div>
          <Button
            size="sm"
            onClick={handleAddToCart}
            className="h-8 w-full shrink-0 px-3 text-xs bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
          >
            <ShoppingCart className="w-3.5 h-3.5 mr-1" aria-hidden />
            Add
          </Button>
        </div>
      </div>
    </article>
  )
}
