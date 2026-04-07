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

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (product.stock === 0) return
    addToCart({
      id: product.id, name: product.name, slug: product.slug,
      images: product.images, price: product.price, stock: product.stock, sku: product.sku,
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
        'group relative bg-card rounded-lg border border-border overflow-hidden',
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
        {product.stock === 0 && (
          <Badge variant="outline" className="text-[10px] font-mono uppercase tracking-wider">
            Sold Out
          </Badge>
        )}
      </div>

      {/* Wishlist */}
      <button
        onClick={handleWishlist}
        aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        className={cn(
          'absolute top-3 right-3 z-10 p-1.5 rounded-full bg-background/80 backdrop-blur-sm',
          'opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110',
          isWishlisted && 'opacity-100 text-destructive'
        )}
      >
        <Heart className={cn('w-4 h-4', isWishlisted && 'fill-current text-destructive')} />
      </button>

      {/* Image */}
      <Link href={`/products/${product.slug}`} className="block aspect-square overflow-hidden bg-surface">
        <Image
          src={product.images[0] ?? '/placeholder-product.jpg'}
          alt={product.name}
          width={400}
          height={400}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          unoptimized
        />
      </Link>

      {/* Content */}
      <div className="p-4">
        {product.category && (
          <Link
            href={`/categories/${product.category.slug}`}
            className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
          >
            {product.category.name}
          </Link>
        )}
        <Link href={`/products/${product.slug}`} className="block mt-1">
          <h3 className="font-semibold text-sm leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
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
        <div className="flex items-center justify-between mt-3 gap-2">
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-foreground">₦{product.price.toLocaleString()}</span>
            {product.comparePrice && (
              <span className="text-xs text-muted-foreground line-through">
                ₦{product.comparePrice.toLocaleString()}
              </span>
            )}
          </div>
          <Button
            size="sm"
            disabled={product.stock === 0}
            onClick={handleAddToCart}
            className="h-8 px-3 text-xs bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
          >
            <ShoppingCart className="w-3.5 h-3.5 mr-1" aria-hidden />
            Add
          </Button>
        </div>
      </div>
    </article>
  )
}
