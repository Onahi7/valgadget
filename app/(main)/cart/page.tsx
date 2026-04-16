'use client'

import Link from 'next/link'
import { ShoppingBag, ArrowRight, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty'
import { CartItem } from '@/components/ecommerce/cart-item'
import { CheckoutSummary } from '@/components/ecommerce/checkout-summary'
import { useCart } from '@/contexts/cart-context'
import { useState } from 'react'
import { toast } from 'sonner'

export default function CartPage() {
  const { items, itemCount, clearCart, applyCoupon, couponCode, removeCoupon } = useCart()
  const [couponInput, setCouponInput] = useState('')

  const handleApplyCoupon = () => {
    if (!couponInput.trim()) return
    // Mock coupon validation — replace with API call
    if (couponInput.toUpperCase() === 'WELCOME10') {
      applyCoupon('WELCOME10', 10)
      toast.success('Coupon applied: WELCOME10 — $10 off!')
    } else {
      toast.error('Invalid coupon code')
    }
  }

  if (itemCount === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-page-reveal">
        <Empty className="py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon"><ShoppingBag className="size-6" /></EmptyMedia>
            <EmptyTitle>Your cart is empty</EmptyTitle>
            <EmptyDescription>Add some awesome gear to get started.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild><Link href="/shop"><ShoppingBag className="w-4 h-4 mr-2" /> Shop Now</Link></Button>
          </EmptyContent>
        </Empty>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-page-reveal">
      <div className="flex items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl font-bold">Cart <span className="text-muted-foreground font-normal text-xl">({itemCount})</span></h1>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive gap-1.5"
          onClick={() => { clearCart(); toast('Cart cleared') }}
        >
          <Trash2 className="w-4 h-4" /> Clear all
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-xl border border-border p-4">
            {items.map(item => <CartItem key={item.product.id} item={item} />)}
          </div>

          {/* Coupon */}
          <div className="mt-4 flex gap-3">
            {couponCode ? (
              <div className="flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 rounded-md px-4 py-2 text-sm font-medium">
                <span>Coupon: <strong>{couponCode}</strong> applied</span>
                <button onClick={removeCoupon} className="hover:opacity-70 font-bold ml-2" aria-label="Remove coupon">×</button>
              </div>
            ) : (
              <>
                <Input
                  placeholder="Coupon code (try WELCOME10)"
                  value={couponInput}
                  onChange={e => setCouponInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                  className="max-w-xs"
                />
                <Button variant="outline" onClick={handleApplyCoupon}>Apply</Button>
              </>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="flex flex-col gap-4">
          <CheckoutSummary />
          <Button
            size="lg"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            asChild
          >
            <Link href="/checkout">
              Proceed to Checkout <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <Button variant="ghost" size="sm" className="w-full text-muted-foreground" asChild>
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
