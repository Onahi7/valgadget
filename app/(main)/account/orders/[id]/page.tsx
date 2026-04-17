'use client'

import { use, useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, Package, MapPin, CreditCard, Truck, Download, Printer, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { orderService, type Order } from '@/lib/services/order.service'
import { getToken } from '@/lib/api-client'
import { toast } from 'sonner'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  processing: 'bg-blue-100 text-blue-700 border-blue-200',
  shipped: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  delivered: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
  refunded: 'bg-gray-100 text-gray-600 border-gray-200',
}

const STEPS = ['pending', 'processing', 'shipped', 'delivered']

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [requerying, setRequerying] = useState(false)

  useEffect(() => {
    orderService.getMyOrderById(id)
      .then(setOrder)
      .catch(() => setOrder(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-12 animate-pulse space-y-4">
      <div className="h-8 bg-muted rounded w-1/3" />
      <div className="h-40 bg-muted rounded-xl" />
      <div className="h-40 bg-muted rounded-xl" />
    </div>
  )

  if (!order) return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <p className="text-xl font-bold mb-4">Order not found</p>
      <Button asChild><Link href="/account/orders">Back to Orders</Link></Button>
    </div>
  )

  const stepIdx = STEPS.indexOf(order.status)

  return (
    <ProtectedRoute>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 animate-page-reveal">
        <Link href="/account/orders" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Orders
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
          <div>
            <h1 className="text-2xl font-bold font-mono">{order.reference}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Placed {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`text-sm px-3 py-1 border font-medium capitalize ${STATUS_COLORS[order.status] ?? ''}`}>
              {order.status}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => window.print()} className="print:hidden gap-1.5">
              <Printer className="w-3.5 h-3.5" /> Print Receipt
            </Button>
          </div>
        </div>

        {/* Tracker */}
        {!['cancelled', 'refunded'].includes(order.status) && (
          <div className="bg-card border border-border rounded-xl p-6 mb-6">
            <h2 className="font-bold text-sm mb-5 flex items-center gap-2"><Truck className="w-4 h-4 text-primary" /> Tracking</h2>
            <div className="flex items-center justify-between relative">
              <div className="absolute top-3.5 left-4 right-4 h-0.5 bg-border" />
              <div className="absolute top-3.5 left-4 h-0.5 bg-primary transition-all" style={{ width: stepIdx >= 0 ? `${(stepIdx / (STEPS.length - 1)) * 100}%` : '0%', maxWidth: 'calc(100% - 2rem)' }} />
              {STEPS.map((s, i) => (
                <div key={s} className="flex flex-col items-center gap-2 relative z-10">
                  <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center ${i <= stepIdx ? 'bg-primary border-primary text-primary-foreground' : 'bg-background border-border'}`}>
                    {i < stepIdx ? '✓' : <span className="w-2 h-2 rounded-full bg-current" />}
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground capitalize">{s}</span>
                </div>
              ))}
            </div>
            {order.trackingNumber && (
              <p className="text-xs text-muted-foreground mt-4">
                Tracking: <span className="font-mono font-bold text-foreground">{order.trackingNumber}</span>
              </p>
            )}
          </div>
        )}

        {/* Items */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <h2 className="font-bold text-sm mb-4 flex items-center gap-2"><Package className="w-4 h-4 text-primary" /> Items ({order.items.length})</h2>
          <div className="flex flex-col gap-4">
            {order.items.map(item => (
              <div key={item.id} className="flex gap-4 items-start">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-surface border border-border shrink-0">
                  <Image src={item.product.images[0]} alt={item.product.name} width={64} height={64} className="object-cover w-full h-full" unoptimized />
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${item.product.slug}`} className="font-semibold text-sm hover:text-primary transition-colors line-clamp-1">{item.product.name}</Link>
                  <p className="text-xs text-muted-foreground mt-0.5">Qty: {item.quantity} × ₦{item.unitPrice.toLocaleString()}</p>
                </div>
                <span className="font-bold text-sm shrink-0">₦{item.totalPrice.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <Separator className="my-4" />
          <div className="flex flex-col gap-2 text-sm">
            {[['Subtotal', order.subtotal], ['Shipping', order.shippingCost], ['Tax', order.tax], ['Discount', -order.discount]].map(([label, val]) => (
              Number(val) !== 0 && (
                <div key={String(label)} className="flex justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <span className={Number(val) < 0 ? 'text-green-600' : ''}>{Number(val) < 0 ? '-' : ''}₦{Math.abs(Number(val)).toLocaleString()}</span>
                </div>
              )
            ))}
            <div className="flex justify-between font-bold text-base pt-1 border-t border-border mt-1">
              <span>Total</span>
              <span>₦{order.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* Shipping address */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="font-bold text-sm mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Shipping Address</h2>
            <div className="text-sm text-muted-foreground space-y-0.5">
              <p className="text-foreground font-medium">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
              <p>{order.shippingAddress.country}</p>
              <p>{order.shippingAddress.phone}</p>
            </div>
          </div>
          {/* Payment */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="font-bold text-sm mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4 text-primary" /> Payment</h2>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Method: <span className="text-foreground font-medium capitalize">{order.paymentMethod.replace('_', ' ')}</span></p>
              <p>Status: <Badge className={`text-xs border font-medium capitalize ml-1 ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>{order.paymentStatus}</Badge></p>
            {order.paymentMethod === 'paystack' && order.paymentStatus !== 'paid' && order.status !== 'cancelled' && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2 gap-1.5"
                disabled={requerying}
                onClick={async () => {
                  setRequerying(true)
                  try {
                    const res = await fetch('/api/payments/paystack/requery', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                      body: JSON.stringify({ orderId: order.id }),
                    })
                    const json = await res.json()
                    if (res.ok && json.paymentStatus === 'paid') {
                      toast.success(json.message ?? 'Payment confirmed!')
                      // Refresh order data
                      const updated = await orderService.getMyOrderById(id)
                      setOrder(updated)
                    } else {
                      toast.info(json.message ?? 'Payment not yet completed. Please try again shortly.')
                    }
                  } catch {
                    toast.error('Failed to verify payment. Please try again.')
                  } finally {
                    setRequerying(false)
                  }
                }}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${requerying ? 'animate-spin' : ''}`} />
                {requerying ? 'Verifying…' : 'Verify Payment'}
              </Button>
            )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
