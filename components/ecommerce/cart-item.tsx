'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart, type CartItem as CartItemType } from '@/contexts/cart-context'

interface CartItemProps {
  item: CartItemType
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeFromCart } = useCart()

  return (
    <div className="flex gap-4 py-4 border-b border-border last:border-0">
      <Link href={`/products/${item.product.slug}`} className="shrink-0">
        <Image
          src={item.product.images[0] ?? '/placeholder-product.svg'}
          alt={item.product.name}
          width={80}
          height={80}
          className="w-20 h-20 object-cover rounded-md bg-surface"
          unoptimized
        />
      </Link>
      <div className="flex-1 min-w-0">
        <Link href={`/products/${item.product.slug}`} className="font-medium text-sm hover:text-primary transition-colors line-clamp-2">
          {item.product.name}
        </Link>
        <p className="text-xs text-muted-foreground mt-0.5 font-mono">{item.product.sku}</p>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center border border-border rounded-md overflow-hidden">
            <button
              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
              aria-label="Decrease quantity"
              className="px-2 py-1.5 hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="px-3 py-1.5 text-sm font-medium min-w-[36px] text-center tabular-nums">
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
              disabled={item.quantity >= item.product.stock}
              aria-label="Increase quantity"
              className="px-2 py-1.5 hover:bg-accent transition-colors text-muted-foreground hover:text-foreground disabled:opacity-40"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-bold text-sm">
              ₦{(item.product.price * item.quantity).toLocaleString()}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => removeFromCart(item.product.id)}
              aria-label="Remove from cart"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
