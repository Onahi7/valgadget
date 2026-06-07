'use client'

import { useEffect, useState } from 'react'
import { Plus, Minus, ShoppingCart, Heart, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/contexts/cart-context'
import { useWishlist } from '@/contexts/wishlist-context'
import { useCartDrawer } from '@/contexts/cart-drawer-context'
import { formatPrice } from '@/lib/utils'
import { toast } from 'sonner'
import type { Product } from '@/lib/services/product.service'

interface StickyBuyBarProps {
  product: Product
}

/**
 * Mobile-first sticky bottom buy bar for PDP.
 * Shows price + quantity stepper + Add to Cart. Floats above content.
 */
export function StickyBuyBar({ product }: StickyBuyBarProps) {
  const [qty, setQty] = useState(1)
  const [visible, setVisible] = useState(false)
  const { addToCart } = useCart()
  const { toggle, has } = useWishlist()
  const { openCart } = useCartDrawer()
  const isWishlisted = has(product.id)

  // Show bar only after user scrolls past the main buy box
  useEffect(() => {
    const handler = () => {
      // Show after 600px scroll
      setVisible(window.scrollY > 600)
    }
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const handleAdd = () => {
    if (product.stock <= 0) return
    addToCart({
      id: product.id, name: product.name, slug: product.slug,
      images: product.images, price: product.price, sku: product.sku, stock: product.stock,
    }, qty)
    toast.success('Added to cart', { description: `${qty} × ${product.name}` })
    setTimeout(() => openCart(), 300)
  }

  const handleWishlist = () => {
    toggle({
      id: product.id, name: product.name, slug: product.slug,
      images: product.images, price: product.price, comparePrice: product.comparePrice,
      stock: product.stock, sku: product.sku,
    })
    toast(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist')
  }

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur-md safe-area-bottom transition-transform duration-300 md:hidden ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="flex items-center gap-2 px-3 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{formatPrice(product.price)}</p>
          {product.stock > 0 && product.stock <= 5 ? (
            <p className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
              <Zap className="h-2.5 w-2.5" />
              Only {product.stock} left
            </p>
          ) : product.stock > 0 ? (
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400">In stock</p>
          ) : (
            <p className="text-[10px] text-muted-foreground">Out of stock</p>
          )}
        </div>
        <div className="flex items-center rounded-md border border-border">
          <button
            onClick={() => setQty(q => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
            className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="flex h-8 w-8 items-center justify-center text-xs font-medium">{qty}</span>
          <button
            onClick={() => setQty(q => Math.min(product.stock, q + 1))}
            aria-label="Increase quantity"
            disabled={qty >= product.stock}
            className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
        <Button
          size="sm"
          onClick={handleAdd}
          disabled={product.stock <= 0}
          className="h-9 shrink-0 px-4"
        >
          <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
          Add
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleWishlist}
          aria-label="Add to wishlist"
          className="h-9 w-9 shrink-0"
        >
          <Heart className={cn('h-4 w-4', isWishlisted && 'fill-destructive text-destructive')} />
        </Button>
      </div>
    </div>
  )
}

// Need cn import for the wishlist class
import { cn } from '@/lib/utils'
