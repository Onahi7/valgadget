'use client'

import Link from 'next/link'
import { ShoppingBag, ArrowRight, Trash2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CartItem } from '@/components/ecommerce/cart-item'
import { CheckoutSummary } from '@/components/ecommerce/checkout-summary'
import { EmptyState } from '@/components/ecommerce/empty-state'
import { useCart } from '@/contexts/cart-context'
import { useState } from 'react'
import { toast } from 'sonner'
import { paymentService } from '@/lib/services/payment.service'

export default function CartPage() {
  const { items, itemCount, total, clearCart, applyCoupon, couponCode, removeCoupon } = useCart()
  const [couponInput, setCouponInput] = useState('')
  const [validating, setValidating] = useState(false)

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return

    setValidating(true)
    try {
      const data = await paymentService.validateCoupon(couponInput.toUpperCase(), total)

      if (data.isValid) {
        applyCoupon(data.code, data.discountAmount)
        toast.success(data.message ?? 'Coupon applied')
        setCouponInput('')
      } else {
        toast.error(data.message ?? 'Invalid coupon code')
      }
    } catch (err) {
      toast.error('Failed to validate coupon')
    } finally {
      setValidating(false)
    }
  }

  if (itemCount === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-page-reveal">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Looks like you haven't added anything yet. Browse our shop to find your next favorite gadget."
          action={{ label: 'Shop Now', href: '/shop' }}
          secondaryAction={{ label: 'Browse Categories', href: '/categories' }}
        />
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
                  placeholder="Enter coupon code"
                  value={couponInput}
                  onChange={e => setCouponInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                  className="max-w-xs"
                  disabled={validating}
                />
                <Button variant="outline" onClick={handleApplyCoupon} disabled={validating}>
                  {validating ? 'Validating...' : 'Apply'}
                </Button>
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
          <Button
            size="lg"
            variant="outline"
            className="w-full"
            asChild
          >
            <Link href="/shop">
              <ArrowLeft className="w-4 h-4 mr-2" /> Continue Shopping
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
