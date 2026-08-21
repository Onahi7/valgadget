'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Package, CheckCircle, Truck, Home, Mail, Phone, MapPin, Calendar, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Order {
  id: string
  reference: string
  status: string
  paymentStatus: string
  paymentMethod: string
  items: Array<{
    productId: string
    name: string
    sku: string
    price: number
    qty: number
    image?: string
  }>
  subtotal: number
  shipping: number
  tax: number
  total: number
  shippingAddress: {
    fullName: string
    line1: string
    line2?: string
    city: string
    state: string
    postalCode: string
    country: string
    phone?: string
  }
  createdAt: string
  guestEmail?: string
  trackingNumber?: string
  trackingUrl?: string
}

export default function GuestOrderPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const orderId = params.id as string
  const accessToken = searchParams.get('token') ?? ''
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orderId) return

    fetch(`/api/orders/guest/${orderId}?token=${encodeURIComponent(accessToken)}`)
      .then(res => res.json())
      .then(data => {
        if (data.id) {
          setOrder(data)
        } else {
          toast.error('Order not found')
        }
      })
      .catch(() => toast.error('Failed to load order'))
      .finally(() => setLoading(false))
  }, [accessToken, orderId])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Order Not Found</h1>
        <p className="text-muted-foreground mb-6">
          We couldn't find this order. Please check your email for the correct link.
        </p>
        <Button asChild>
          <Link href="/shop">Continue Shopping</Link>
        </Button>
      </div>
    )
  }

  const statusSteps = [
    { key: 'pending', label: 'Order Placed', icon: CheckCircle },
    { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
    { key: 'processing', label: 'Processing', icon: Package },
    { key: 'shipped', label: 'Shipped', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: Home },
  ]

  const currentStepIndex = statusSteps.findIndex(s => s.key === order.status)

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="bg-card border rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">Order Confirmation</h1>
            <p className="text-muted-foreground">
              Order #{order.reference}
            </p>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Placed on {new Date(order.createdAt).toLocaleDateString('en-NG', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <CreditCard className="w-4 h-4" />
            <span className="capitalize">{order.paymentMethod.replace('_', ' ')}</span>
          </div>
        </div>
        {order.trackingNumber && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 p-4 text-sm">
            <span>Tracking: <strong className="font-mono">{order.trackingNumber}</strong></span>
            {order.trackingUrl && <Button asChild size="sm" variant="outline"><a href={order.trackingUrl} target="_blank" rel="noreferrer">Track shipment</a></Button>}
          </div>
        )}
      </div>

      {/* Order Status Timeline */}
      <div className="bg-card border rounded-xl p-6 mb-6">
        <h2 className="font-bold text-lg mb-6">Order Status</h2>
        <div className="relative">
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-border" />
          <div 
            className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500"
            style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
          />
          <div className="relative flex justify-between">
            {statusSteps.map((step, i) => {
              const Icon = step.icon
              const isActive = i <= currentStepIndex
              return (
                <div key={step.key} className="flex flex-col items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    isActive 
                      ? 'bg-primary border-primary text-primary-foreground' 
                      : 'bg-background border-border text-muted-foreground'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-xs font-medium text-center max-w-[80px] ${
                    isActive ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-card border rounded-xl p-6 mb-6">
        <h2 className="font-bold text-lg mb-4">Order Items</h2>
        <div className="space-y-4">
          {order.items.map((item, i) => (
            <div key={i} className="flex gap-4 pb-4 border-b last:border-0">
              {item.image && (
                <img 
                  src={item.image} 
                  alt={item.name}
                  className="w-20 h-20 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                <p className="text-sm text-muted-foreground">Qty: {item.qty}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">₦{(item.price * item.qty).toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">₦{item.price.toLocaleString()} each</p>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="mt-6 pt-6 border-t space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>₦{order.subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Shipping</span>
            <span>₦{order.shipping.toLocaleString()}</span>
          </div>
          {order.tax > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span>₦{order.tax.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold pt-2 border-t">
            <span>Total</span>
            <span>₦{order.total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      <div className="bg-card border rounded-xl p-6 mb-6">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Shipping Address
        </h2>
        <div className="space-y-1 text-sm">
          <p className="font-semibold">{order.shippingAddress.fullName}</p>
          <p className="text-muted-foreground">{order.shippingAddress.line1}</p>
          {order.shippingAddress.line2 && (
            <p className="text-muted-foreground">{order.shippingAddress.line2}</p>
          )}
          <p className="text-muted-foreground">
            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
          </p>
          <p className="text-muted-foreground">{order.shippingAddress.country}</p>
          {order.shippingAddress.phone && (
            <p className="text-muted-foreground flex items-center gap-2 mt-2">
              <Phone className="w-4 h-4" />
              {order.shippingAddress.phone}
            </p>
          )}
        </div>
      </div>

      {/* Contact Info */}
      {order.guestEmail && (
        <div className="bg-muted/50 border rounded-xl p-6 mb-6">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-semibold mb-1">Order Confirmation Sent</h3>
              <p className="text-sm text-muted-foreground">
                We've sent a confirmation email to <strong>{order.guestEmail}</strong>
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Save this page or check your email for order updates.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button asChild className="flex-1">
          <Link href="/shop">Continue Shopping</Link>
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <Link href="/contact">Contact Support</Link>
        </Button>
      </div>

      {/* Create Account CTA */}
      <div className="mt-6 bg-primary/5 border border-primary/20 rounded-xl p-6 text-center">
        <h3 className="font-bold mb-2">Want to track your orders easily?</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Create an account to view all your orders in one place, save addresses, and get faster checkout.
        </p>
        <Button asChild variant="outline">
          <Link href="/register">Create Account</Link>
        </Button>
      </div>
    </div>
  )
}
