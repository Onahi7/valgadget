'use client'

import { useCart } from '@/contexts/cart-context'
import { Separator } from '@/components/ui/separator'

interface CheckoutSummaryProps {
  shipping?: number
  tax?: number
}

export function CheckoutSummary({ shipping = 0, tax = 0 }: CheckoutSummaryProps) {
  const { items, subtotal, discount, total } = useCart()

  const grandTotal = total + shipping + tax

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h2 className="font-bold text-base mb-4">Order Summary</h2>
      <div className="flex flex-col gap-2 text-sm">
        {items.map(item => (
          <div key={item.product.id} className="flex justify-between gap-2">
            <span className="text-muted-foreground truncate flex-1">
              {item.product.name} <span className="text-foreground">×{item.quantity}</span>
            </span>
            <span className="font-medium shrink-0">
              ₦{(item.product.price * item.quantity).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
      <Separator className="my-4" />
      <div className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>₦{subtotal.toLocaleString()}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-primary">
            <span>Discount</span>
            <span>-₦{discount.toLocaleString()}</span>
          </div>
        )}
        {shipping > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span>₦{shipping.toLocaleString()}</span>
          </div>
        )}
        {tax > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax</span>
            <span>₦{tax.toLocaleString()}</span>
          </div>
        )}
      </div>
      <Separator className="my-4" />
      <div className="flex justify-between font-bold text-base">
        <span>Total</span>
        <span>₦{grandTotal.toLocaleString()}</span>
      </div>
    </div>
  )
}
