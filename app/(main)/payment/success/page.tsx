'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, Package, Download, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { orderService, type Order } from '@/lib/services/order.service'

function SuccessContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId') ?? searchParams.get('order')
  const [order, setOrder] = useState<Order | null>(null)

  useEffect(() => {
    if (orderId) {
      orderService.getMyOrderById(orderId).then(setOrder).catch(() => {})
    }
  }, [orderId])

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6 animate-page-reveal">
        <div className="relative mx-auto w-24 h-24">
          <div className="absolute inset-0 rounded-full bg-green-100 dark:bg-green-900/30 animate-ping opacity-30" />
          <div className="relative w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-green-700 dark:text-green-400">Payment Successful!</h1>
          <p className="text-muted-foreground mt-2">Your order has been confirmed and is being processed.</p>
        </div>

        {order && (
          <div className="bg-card border border-border rounded-2xl p-6 text-left space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Order Reference</span>
              <span className="font-mono font-bold">{order.reference}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Items</span>
              <span>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-bold">₦{order.total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <span className="text-green-600 font-semibold capitalize">{order.status}</span>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {orderId && (
            <>
              <Button asChild>
                <Link href={`/account/orders/${orderId}`}>
                  <Package className="w-4 h-4 mr-2" /> View Order
                </Link>
              </Button>
              <Button variant="outline" onClick={() => window.print()}>
                <Download className="w-4 h-4 mr-2" /> Print Receipt
              </Button>
            </>
          )}
          <Button variant="ghost" asChild>
            <Link href="/shop">
              <Home className="w-4 h-4 mr-2" /> Continue Shopping
            </Link>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Track your order in{' '}
          <Link href="/account/orders" className="text-primary hover:underline">My Orders</Link>.
        </p>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>}>
      <SuccessContent />
    </Suspense>
  )
}
