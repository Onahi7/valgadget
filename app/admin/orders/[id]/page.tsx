'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Package, Truck, CheckCircle2, XCircle, Clock, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { OrderStatus } from '@/lib/services/order.service'
import { cn } from '@/lib/utils'
import { getToken } from '@/lib/api-client'
import { toast } from 'sonner'

const STATUS_COLORS: Record<string, string> = {
  pending:    'bg-amber-100 text-amber-700 border-amber-200',
  confirmed:  'bg-emerald-100 text-emerald-700 border-emerald-200',
  processing: 'bg-blue-100 text-blue-700 border-blue-200',
  shipped:    'bg-indigo-100 text-indigo-700 border-indigo-200',
  delivered:  'bg-green-100 text-green-700 border-green-200',
  cancelled:  'bg-red-100 text-red-700 border-red-200',
  refunded:   'bg-gray-100 text-gray-700 border-gray-200',
}

const TIMELINE: { status: OrderStatus; label: string; icon: typeof Clock }[] = [
  { status: 'pending',    label: 'Order Placed',   icon: Clock },
  { status: 'confirmed',  label: 'Confirmed',      icon: CheckCircle2 },
  { status: 'processing', label: 'Processing',     icon: RefreshCcw },
  { status: 'shipped',    label: 'Shipped',        icon: Truck },
  { status: 'delivered',  label: 'Delivered',      icon: CheckCircle2 },
]

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [order, setOrder]       = useState<any>(null)
  const [loading, setLoading]   = useState(true)
  const [tracking, setTracking] = useState('')
  const [note, setNote]         = useState('')

  useEffect(() => {
    fetch(`/api/admin/orders/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.json())
      .then(d => { if (d.data) setOrder(d.data) })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="py-20 text-center text-muted-foreground text-sm">Loading...</div>

  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground mb-4">Order not found</p>
        <Button asChild variant="outline"><Link href="/admin/orders"><ArrowLeft className="w-4 h-4 mr-2" />Back to Orders</Link></Button>
      </div>
    )
  }

  const currentStep = TIMELINE.findIndex(t => t.status === order.status)

  const updateStatus = async (status: OrderStatus) => {
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      setOrder((prev: any) => prev ? { ...prev, status } : prev)
      toast.success(`Status updated to ${status}`)
    } else {
      toast.error('Failed to update status')
    }
  }

  const addTracking = async () => {
    if (!tracking.trim()) return
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ trackingNumber: tracking }),
    })
    if (res.ok) {
      setOrder((prev: any) => prev ? { ...prev, trackingNumber: tracking } : prev)
      toast.success('Tracking number saved')
      setTracking('')
    } else {
      toast.error('Failed to save tracking number')
    }
  }

  return (
    <div className="space-y-6 max-w-5xl animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" asChild className="mt-0.5 shrink-0">
          <Link href="/admin/orders"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold font-mono">{order.reference}</h1>
            <Badge className={cn('border capitalize', STATUS_COLORS[order.status])}>{order.status}</Badge>
            <Badge className={cn('border capitalize', order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-amber-100 text-amber-700 border-amber-200')}>
              {order.paymentStatus}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Placed {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Timeline */}
      {order.status !== 'cancelled' && order.status !== 'refunded' && (
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-border -translate-y-1/2" />
            {TIMELINE.map((step, i) => {
              const done = i <= currentStep
              return (
                <div key={step.status} className="flex flex-col items-center gap-2 relative z-10">
                  <div className={cn('w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all',
                    done ? 'bg-primary border-primary text-primary-foreground' : 'bg-card border-border text-muted-foreground'
                  )}>
                    <step.icon className="w-4 h-4" />
                  </div>
                  <span className={cn('text-[11px] font-medium text-center', done ? 'text-primary' : 'text-muted-foreground')}>{step.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: items + totals */}
        <div className="lg:col-span-2 space-y-5">
          {/* Items */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <Package className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-bold text-sm">Order Items</h2>
            </div>
            <div className="divide-y divide-border">
              {(order.items ?? []).map((item: any, idx: number) => (
                <div key={idx} className="px-5 py-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface border border-border shrink-0">
                    {item.image && <Image src={item.image} alt={item.name} width={48} height={48} className="object-cover w-full h-full" unoptimized />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{item.sku}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium">₦{item.price.toLocaleString()} × {item.qty}</p>
                    <p className="text-sm font-bold">₦{(item.price * item.qty).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-4 bg-muted/20 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>₦{Number(order.subtotal).toLocaleString()}</span></div>
              {Number(order.shipping) > 0 && <div className="flex justify-between text-muted-foreground"><span>Shipping</span><span>₦{Number(order.shipping).toLocaleString()}</span></div>}
              <div className="flex justify-between text-muted-foreground"><span>Tax</span><span>₦{Number(order.tax).toLocaleString()}</span></div>
              {Number(order.discount) > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-₦{Number(order.discount).toLocaleString()}</span></div>}
              <Separator />
              <div className="flex justify-between font-bold text-base"><span>Total</span><span>₦{Number(order.total).toLocaleString()}</span></div>
            </div>
          </div>

          {/* Tracking */}
          <div className="bg-card border border-border rounded-lg p-5">
            <h2 className="font-bold text-sm mb-4">Tracking</h2>
            {order.trackingNumber ? (
              <p className="font-mono text-sm bg-muted/30 px-3 py-2 rounded-md">{order.trackingNumber}</p>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter tracking number..."
                  value={tracking}
                  onChange={e => setTracking(e.target.value)}
                  className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <Button size="sm" onClick={addTracking} className="bg-primary text-primary-foreground hover:bg-primary/90">Save</Button>
              </div>
            )}
          </div>
        </div>

        {/* Right: customer + actions */}
        <div className="space-y-5">
          {/* Customer */}
          <div className="bg-card border border-border rounded-lg p-5">
            <h2 className="font-bold text-sm mb-4">Shipping Address</h2>
            <div className="text-sm text-muted-foreground space-y-0.5">
              <p className="font-medium text-foreground">{order.shippingAddress?.fullName ?? '—'}</p>
              <p>{order.shippingAddress?.line1}</p>
              {order.shippingAddress?.line2 && <p>{order.shippingAddress.line2}</p>}
              <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}</p>
              <p>{order.shippingAddress?.country}</p>
              {order.shippingAddress?.phone && <p className="pt-1">{order.shippingAddress.phone}</p>}
            </div>
          </div>

          {/* Payment */}
          <div className="bg-card border border-border rounded-lg p-5">
            <h2 className="font-bold text-sm mb-4">Payment</h2>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method</span>
                <span className="font-medium capitalize">{(order.paymentMethod ?? '').replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge className={cn('text-[11px] border capitalize', order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-amber-100 text-amber-700 border-amber-200')}>{order.paymentStatus}</Badge>
              </div>
            </div>
          </div>

          {/* Status Actions */}
          <div className="bg-card border border-border rounded-lg p-5">
            <h2 className="font-bold text-sm mb-4">Update Status</h2>
            <div className="flex flex-col gap-2">
              {(['processing', 'shipped', 'delivered'] as OrderStatus[]).map(s => (
                <Button
                  key={s}
                  variant="outline"
                  size="sm"
                  disabled={order.status === s}
                  onClick={() => updateStatus(s)}
                  className="justify-start capitalize"
                >
                  {s === 'processing' && <RefreshCcw className="w-3.5 h-3.5 mr-2" />}
                  {s === 'shipped' && <Truck className="w-3.5 h-3.5 mr-2" />}
                  {s === 'delivered' && <CheckCircle2 className="w-3.5 h-3.5 mr-2" />}
                  Mark as {s}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                disabled={order.status === 'cancelled'}
                onClick={() => updateStatus('cancelled')}
                className="justify-start text-destructive border-destructive/30 hover:bg-destructive/5"
              >
                <XCircle className="w-3.5 h-3.5 mr-2" /> Cancel Order
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
