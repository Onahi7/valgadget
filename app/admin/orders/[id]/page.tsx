'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, CheckCircle2, Clock, ExternalLink, Package, RefreshCcw, Truck, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import type { OrderStatus, PaymentStatus } from '@/lib/services/order.service'
import { cn } from '@/lib/utils'
import { getToken } from '@/lib/api-client'
import { toast } from 'sonner'
import { ORDER_STATUS_COLORS, PAYMENT_STATUS_COLORS } from '@/lib/constants/admin-status-colors'

const PAYMENT_OPTIONS: PaymentStatus[] = ['unpaid', 'pending', 'pending_verification', 'paid', 'failed']

const TIMELINE: { status: OrderStatus; label: string; icon: typeof Clock }[] = [
  { status: 'pending', label: 'Order Placed', icon: Clock },
  { status: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { status: 'processing', label: 'Processing', icon: RefreshCcw },
  { status: 'shipped', label: 'Shipped', icon: Truck },
  { status: 'delivered', label: 'Delivered', icon: CheckCircle2 },
]

function formatNaira(value: number) {
  return `₦${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tracking, setTracking] = useState('')
  const [trackingUrl, setTrackingUrl] = useState('')
  const [notifyCustomer, setNotifyCustomer] = useState(true)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pending')
  const [paymentRef, setPaymentRef] = useState('')
  const [notes, setNotes] = useState('')
  const [savingMeta, setSavingMeta] = useState(false)
  const [refundReason, setRefundReason] = useState('')
  const [manualRefundConfirmed, setManualRefundConfirmed] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/orders/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
      credentials: 'include',
    })
      .then(r => r.json())
      .then(data => {
        if (data) {
          setOrder(data)
          setTracking(data.trackingNumber ?? '')
          setTrackingUrl(data.trackingUrl ?? '')
          setPaymentStatus((data.paymentStatus ?? 'pending') as PaymentStatus)
          setPaymentRef(data.paymentRef ?? '')
          setNotes(data.notes ?? '')
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  const patchOrder = async (payload: Record<string, unknown>, successMessage: string) => {
    const res = await fetch(`/api/admin/orders/${id}/notes`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      credentials: 'include',
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      toast.error('Failed to update order')
      return false
    }

    const updated = await res.json()
    setOrder(updated)
    setTracking(updated.trackingNumber ?? '')
    setTrackingUrl(updated.trackingUrl ?? '')
    setPaymentStatus((updated.paymentStatus ?? 'pending') as PaymentStatus)
    setPaymentRef(updated.paymentRef ?? '')
    setNotes(updated.notes ?? '')
    toast.success(successMessage)
    return true
  }

  const updateStatus = async (status: OrderStatus) => {
    const res = await fetch(`/api/admin/orders/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, credentials: 'include', body: JSON.stringify({ status }) })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) return toast.error(json.message ?? 'Failed to update status')
    setOrder(json)
    toast.success(`Status updated to ${status}`)
  }

  const saveTracking = async () => {
    if (!tracking.trim()) {
      toast.error('Tracking number is required')
      return
    }
    setSavingMeta(true)
    const res = await fetch(`/api/admin/orders/${id}/tracking`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, credentials: 'include', body: JSON.stringify({ trackingNumber: tracking.trim(), trackingUrl: trackingUrl.trim() || undefined, notifyCustomer }) })
    const json = await res.json().catch(() => ({}))
    if (res.ok) { setOrder(json); toast.success(notifyCustomer ? 'Tracking saved and customer notified' : 'Tracking saved') }
    else toast.error(json.message ?? 'Failed to save tracking')
    setSavingMeta(false)
  }

  const savePayment = async () => {
    setSavingMeta(true)
    const isNewConfirmation = paymentStatus === 'paid' && order.paymentStatus !== 'paid'
    if (isNewConfirmation && !confirm(`Confirm payment of ${formatNaira(Number(order.total))} for ${order.reference}? This will notify the customer.`)) { setSavingMeta(false); return }
    const res = await fetch(`/api/admin/orders/${id}/payment-status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, credentials: 'include', body: JSON.stringify({ paymentStatus, paymentRef: paymentRef.trim() || null, confirmed: isNewConfirmation }) })
    const json = await res.json().catch(() => ({}))
    if (res.ok) { setOrder(json); toast.success(isNewConfirmation ? 'Payment confirmed and customer notified' : 'Payment details updated') }
    else toast.error(json.message ?? 'Failed to update payment')
    setSavingMeta(false)
  }

  const refundOrder = async () => {
    if (refundReason.trim().length < 5) return toast.error('Enter a clear refund reason')
    if (!confirm(`Refund the full ${formatNaira(Number(order.total))} for ${order.reference}? This action cannot be undone here.`)) return
    setSavingMeta(true)
    const res = await fetch('/api/admin/payments/refund', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, credentials: 'include', body: JSON.stringify({ orderId: id, reason: refundReason.trim(), manualConfirmed: manualRefundConfirmed }) })
    const json = await res.json().catch(() => ({}))
    if (res.ok) { setOrder(json); setPaymentStatus('refunded'); toast.success(json.refundStatus === 'pending' ? 'Refund submitted to Paystack' : 'Refund recorded and customer notified') }
    else toast.error(json.message ?? 'Refund failed; no refund was recorded')
    setSavingMeta(false)
  }

  const saveNotes = async () => {
    setSavingMeta(true)
    await patchOrder({ note: notes.trim() || null }, 'Notes updated')
    setSavingMeta(false)
  }

  if (loading) return <div className="py-20 text-center text-sm text-muted-foreground">Loading...</div>

  if (!order) {
    return (
      <div className="py-20 text-center">
        <p className="mb-4 text-muted-foreground">Order not found</p>
        <Button asChild variant="outline">
          <Link href="/admin/orders">
            <ArrowLeft className="mr-2 h-4 w-4" />Back to Orders
          </Link>
        </Button>
      </div>
    )
  }

  const currentStep = TIMELINE.findIndex(step => step.status === order.status)

  return (
    <div className="max-w-5xl space-y-6 animate-fade-in">
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" asChild className="mt-0.5 shrink-0">
          <Link href="/admin/orders">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-xl font-bold">{order.reference}</h1>
            <Badge className={cn('border capitalize', ORDER_STATUS_COLORS[order.status])}>{order.status}</Badge>
            <Badge className={cn('border capitalize', PAYMENT_STATUS_COLORS[order.paymentStatus] ?? PAYMENT_STATUS_COLORS.pending)}>
              {String(order.paymentStatus).replace('_', ' ')}
            </Badge>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Placed {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
      </div>

      {order.status !== 'cancelled' && order.status !== 'refunded' && (
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="relative flex items-center justify-between gap-3 overflow-x-auto">
            <div className="absolute left-0 right-0 top-5 h-0.5 -translate-y-1/2 bg-border" />
            {TIMELINE.map((step, index) => {
              const done = index <= currentStep
              return (
                <div key={step.status} className="relative z-10 flex min-w-20 flex-col items-center gap-2">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all',
                      done ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground'
                    )}
                  >
                    <step.icon className="h-4 w-4" />
                  </div>
                  <span className={cn('text-center text-[11px] font-medium', done ? 'text-primary' : 'text-muted-foreground')}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border px-5 py-4">
              <Package className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-bold">Order Items</h2>
            </div>
            <div className="divide-y divide-border">
              {(order.items ?? []).map((item: any, index: number) => (
                <div key={index} className="flex items-center gap-4 px-5 py-4">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-surface">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} width={48} height={48} className="h-full w-full object-contain bg-white p-1" unoptimized />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{item.sku}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-medium">{formatNaira(item.price)} x {item.qty}</p>
                    <p className="text-sm font-bold">{formatNaira(item.price * item.qty)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-2 bg-muted/20 px-5 py-4 text-sm">
              <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatNaira(Number(order.subtotal))}</span></div>
              {Number(order.shipping) > 0 && <div className="flex justify-between text-muted-foreground"><span>Shipping</span><span>{formatNaira(Number(order.shipping))}</span></div>}
              <div className="flex justify-between text-muted-foreground"><span>Tax</span><span>{formatNaira(Number(order.tax))}</span></div>
              {Number(order.discount) > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatNaira(Number(order.discount))}</span></div>}
              <Separator />
              <div className="flex justify-between text-base font-bold"><span>Total</span><span>{formatNaira(Number(order.total))}</span></div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-bold">Tracking</h2>
            <div className="space-y-3">
              <Input
                type="text"
                placeholder="Enter tracking number"
                value={tracking}
                onChange={event => setTracking(event.target.value)}
              />
              <Input type="url" placeholder="Carrier tracking URL (optional)" value={trackingUrl} onChange={event => setTrackingUrl(event.target.value)} />
              <label className="flex items-center gap-2 text-sm text-muted-foreground"><input type="checkbox" checked={notifyCustomer} onChange={event => setNotifyCustomer(event.target.checked)} className="h-4 w-4 accent-primary" />Email the customer after saving</label>
              <div className="flex gap-2"><Button size="sm" onClick={saveTracking} disabled={savingMeta}>Save Tracking</Button>{order.trackingUrl && <Button asChild size="sm" variant="outline"><a href={order.trackingUrl} target="_blank" rel="noreferrer"><ExternalLink className="mr-2 h-3.5 w-3.5" />Open tracking</a></Button>}</div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-bold">Shipping Address</h2>
            <div className="space-y-0.5 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{order.shippingAddress?.fullName ?? '-'}</p>
              <p>{order.shippingAddress?.line1}</p>
              {order.shippingAddress?.line2 && <p>{order.shippingAddress.line2}</p>}
              <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}</p>
              <p>{order.shippingAddress?.country}</p>
              {order.shippingAddress?.phone && <p className="pt-1">{order.shippingAddress.phone}</p>}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-bold">Payment</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method</span>
                <span className="font-medium capitalize">{String(order.paymentMethod ?? '').replace('_', ' ')}</span>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Status</label>
                <select
                  value={paymentStatus}
                  onChange={event => setPaymentStatus(event.target.value as PaymentStatus)}
                  className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {PAYMENT_OPTIONS.map(option => (
                    <option key={option} value={option}>
                      {option.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Reference</label>
                <Input value={paymentRef} onChange={event => setPaymentRef(event.target.value)} placeholder="Transaction reference" />
              </div>
              <Button size="sm" onClick={savePayment} disabled={savingMeta}>Save Payment Details</Button>
              {order.refundStatus && <div className="rounded-md bg-muted p-3 text-xs"><p><strong>Refund:</strong> {order.refundStatus}</p><p>{formatNaira(Number(order.refundAmount ?? 0))} · {order.refundReference}</p><p className="mt-1 text-muted-foreground">{order.refundReason}</p></div>}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-bold">Internal Notes</h2>
            <div className="space-y-3">
              <Textarea
                value={notes}
                onChange={event => setNotes(event.target.value)}
                placeholder="Add fulfilment or payment notes for the team"
                className="min-h-28"
              />
              <Button size="sm" onClick={saveNotes} disabled={savingMeta}>Save Notes</Button>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-bold">Update Status</h2>
            <div className="flex flex-col gap-2">
              {(['confirmed', 'processing', 'shipped', 'delivered'] as OrderStatus[]).map(status => (
                <Button
                  key={status}
                  variant="outline"
                  size="sm"
                  disabled={order.status === status}
                  onClick={() => updateStatus(status)}
                  className="justify-start capitalize"
                >
                  {status === 'confirmed' && <CheckCircle2 className="mr-2 h-3.5 w-3.5" />}
                  {status === 'processing' && <RefreshCcw className="mr-2 h-3.5 w-3.5" />}
                  {status === 'shipped' && <Truck className="mr-2 h-3.5 w-3.5" />}
                  {status === 'delivered' && <CheckCircle2 className="mr-2 h-3.5 w-3.5" />}
                  Mark as {status}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                disabled={order.status === 'cancelled'}
                onClick={() => updateStatus('cancelled')}
                className="justify-start border-destructive/30 text-destructive hover:bg-destructive/5"
              >
                <XCircle className="mr-2 h-3.5 w-3.5" /> Cancel Order
              </Button>
            </div>
          </div>
          {order.paymentStatus === 'paid' && (
            <div className="rounded-lg border border-orange-300 bg-orange-50/40 p-5">
              <h2 className="mb-1 text-sm font-bold text-orange-800">Issue full refund</h2>
              <p className="mb-3 text-xs text-muted-foreground">Paystack refunds are submitted to Paystack first. Other payment methods must already be refunded manually.</p>
              <Textarea value={refundReason} onChange={event => setRefundReason(event.target.value)} placeholder="Reason shown in the customer email" className="mb-3 min-h-20 bg-background" />
              {order.paymentMethod !== 'paystack' && <label className="mb-3 flex items-start gap-2 text-xs"><input type="checkbox" checked={manualRefundConfirmed} onChange={event => setManualRefundConfirmed(event.target.checked)} className="mt-0.5 h-4 w-4 accent-primary" /><span>I confirm the money has already been returned outside this system.</span></label>}
              <Button variant="outline" size="sm" disabled={savingMeta || (order.paymentMethod !== 'paystack' && !manualRefundConfirmed)} onClick={refundOrder} className="border-orange-400 text-orange-700 hover:bg-orange-100"><RefreshCcw className="mr-2 h-3.5 w-3.5" />Refund {formatNaira(Number(order.total))}</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
