'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag, ArrowRight, X, Trash2, Minus, Plus } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useCart } from '@/contexts/cart-context'
import { formatPrice } from '@/lib/utils'
import { toast } from 'sonner'

interface CartDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const { items, itemCount, total, updateQuantity, removeFromCart, clearCart } = useCart()

  const handleRemove = (id: string, name: string) => {
    removeFromCart(id)
    toast('Removed from cart', { description: name })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-4 py-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Your Cart
              {itemCount > 0 && (
                <span className="text-sm font-normal text-muted-foreground">({itemCount})</span>
              )}
            </SheetTitle>
          </div>
          <SheetDescription className="sr-only">
            Items currently in your shopping cart
          </SheetDescription>
        </SheetHeader>

        {/* Items */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <ShoppingBag className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-semibold">Your cart is empty</h3>
              <p className="mt-1 text-sm text-muted-foreground">Browse our shop to add items</p>
              <Button asChild className="mt-4">
                <Link href="/shop" onClick={() => onOpenChange(false)}>Continue Shopping</Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map(item => {
                const imageSrc = item.product.images.find(s => s?.startsWith('/') || s?.includes('ik.imagekit.io')) ?? '/placeholder-product.svg'
                return (
                  <li key={item.product.id} className="flex gap-3 p-4">
                    <Link
                      href={`/products/${item.product.slug}`}
                      onClick={() => onOpenChange(false)}
                      className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted"
                    >
                      <Image
                        src={imageSrc}
                        alt={item.product.name}
                        fill
                        sizes="80px"
                        className="object-contain p-1"
                        unoptimized
                      />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <Link
                        href={`/products/${item.product.slug}`}
                        onClick={() => onOpenChange(false)}
                        className="text-sm font-medium leading-tight hover:text-primary line-clamp-2"
                      >
                        {item.product.name}
                      </Link>
                      <p className="mt-0.5 text-sm font-semibold">{formatPrice(item.product.price)}</p>
                      <div className="mt-auto flex items-center justify-between gap-2">
                        <div className="flex items-center rounded-md border border-border">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            aria-label="Decrease quantity"
                            className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="flex h-7 w-7 items-center justify-center text-xs font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            aria-label="Increase quantity"
                            disabled={item.quantity >= item.product.stock}
                            className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-50"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <button
                          onClick={() => handleRemove(item.product.id, item.product.name)}
                          aria-label="Remove from cart"
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <SheetFooter className="border-t border-border p-4">
            <div className="flex w-full flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="text-base font-semibold">{formatPrice(total)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Shipping and taxes calculated at checkout.</p>
              <Button size="lg" className="w-full" asChild>
                <Link href="/checkout" onClick={() => onOpenChange(false)}>
                  Checkout <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/cart" onClick={() => onOpenChange(false)}>View full cart</Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => { clearCart(); toast('Cart cleared') }}
                >
                  Clear all
                </Button>
              </div>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
