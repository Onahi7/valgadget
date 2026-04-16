'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  CreditCard, Truck, CheckCircle, Bitcoin, Wallet, Copy, Send, Loader2, MapPin,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckoutSummary } from '@/components/ecommerce/checkout-summary'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { useCart } from '@/contexts/cart-context'
import { orderService } from '@/lib/services/order.service'
import { toast } from 'sonner'
import { getToken } from '@/lib/api-client'
import type { ApiError } from '@/lib/api-client'

interface ShippingRate { id: string; state: string; price: string; estimatedDays: number }

const addressSchema = z.object({
  fullName: z.string().min(2, 'Required'),
  line1: z.string().min(3, 'Required'),
  line2: z.string().optional(),
  city: z.string().min(2, 'Required'),
  state: z.string().min(1, 'Select your state'),
  postalCode: z.string().optional(),
  country: z.string().min(2, 'Required'),
  phone: z.string().min(6, 'Required'),
  paymentMethod: z.string().min(1, 'Select a payment method'),
})
type FormValues = z.infer<typeof addressSchema>

const PAYMENT_METHODS = [
  { id: 'paystack',   label: 'Pay with Paystack',        icon: CreditCard, desc: 'Cards, bank transfer, USSD & more' },
  { id: 'bitcoin',    label: 'Bitcoin (BTC)',             icon: Bitcoin,    desc: 'Pay directly to our BTC wallet' },
  { id: 'ethereum',   label: 'Ethereum (ETH)',            icon: Wallet,     desc: 'Pay directly to our ETH wallet' },
  { id: 'usdt_trc20', label: 'USDT (TRC-20 / TRON)',     icon: Wallet,     desc: 'Tether on Tron network — low fees' },
  { id: 'usdt_erc20', label: 'USDT (ERC-20 / Ethereum)', icon: Wallet,     desc: 'Tether on Ethereum network' },
  { id: 'cod',        label: 'Cash on Delivery',          icon: Truck,      desc: 'Pay when your order arrives' },
]

const CRYPTO_ADDRESSES: Record<string, string> = {
  bitcoin:    process.env.NEXT_PUBLIC_BTC_ADDRESS ?? '',
  ethereum:   process.env.NEXT_PUBLIC_ETH_ADDRESS ?? '',
  usdt_trc20: process.env.NEXT_PUBLIC_USDT_TRC20_ADDRESS ?? '',
  usdt_erc20: process.env.NEXT_PUBLIC_USDT_ERC20_ADDRESS ?? '',
}

const CRYPTO_LABELS: Record<string, string> = {
  bitcoin: 'BTC', ethereum: 'ETH', usdt_trc20: 'USDT (TRC-20)', usdt_erc20: 'USDT (ERC-20)',
}

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  )
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, total, clearCart } = useCart()
  const [cryptoTxHash, setCryptoTxHash] = useState('')
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null)
  const [createdOrderRef, setCreatedOrderRef] = useState<string | null>(null)
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([])
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null)

  useEffect(() => {
    fetch('/api/shipping-rates').then(r => r.json()).then(j => {
      if (j.data) setShippingRates(j.data)
    }).catch(() => {})
  }, [])

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: { country: 'NG', paymentMethod: '' },
  })

  const selectedPayment = watch('paymentMethod')
  const watchedState = watch('state')
  const isCrypto = ['bitcoin', 'ethereum', 'usdt_trc20', 'usdt_erc20'].includes(selectedPayment)
  const step = selectedPayment ? 'payment' : 'address'

  // Auto-select shipping rate when state changes
  useEffect(() => {
    if (watchedState && shippingRates.length) {
      const rate = shippingRates.find(r => r.state === watchedState) ?? null
      setSelectedRate(rate)
    }
  }, [watchedState, shippingRates])

  const shippingCost = selectedRate ? Number(selectedRate.price) : 0
  const orderTotal = total + shippingCost

  useEffect(() => {
    if (items.length === 0 && !createdOrderId) {
      router.replace('/cart')
    }
  }, [items.length, createdOrderId, router])

  if (items.length === 0 && !createdOrderId) return null

  const onSubmit = async (data: FormValues) => {
    try {
      const order = await orderService.create({
        items: items.map(i => ({ productId: i.product.id, quantity: i.quantity })),
        shippingAddress: {
          fullName: data.fullName, line1: data.line1, line2: data.line2,
          city: data.city, state: data.state, postalCode: data.postalCode ?? '',
          country: data.country, phone: data.phone,
        },
        paymentMethod: data.paymentMethod,
      })

      clearCart()
      setCreatedOrderId(order.id)
      setCreatedOrderRef(order.reference)

      if (data.paymentMethod === 'paystack') {
        const res = await fetch('/api/payments/paystack/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
          body: JSON.stringify({ orderId: order.id }),
        })
        const json = await res.json()
        if (json.data?.authorization_url) {
          toast.success('Redirecting to Paystack…')
          window.location.href = json.data.authorization_url
          return
        }
        toast.error(json.message ?? 'Paystack init failed')
        return
      }

      if (data.paymentMethod === 'cod') {
        toast.success('Order placed!', { description: `Ref: ${order.reference}` })
        router.push(`/account/orders/${order.id}?new=1`)
      }
      // crypto: stays on page to show wallet panel
    } catch (err) {
      const e = err as ApiError
      toast.error(e.message ?? 'Failed to place order')
    }
  }

  const submitCryptoHash = async () => {
    if (!cryptoTxHash.trim() || !createdOrderId) return
    const res = await fetch('/api/payments/crypto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ orderId: createdOrderId, txHash: cryptoTxHash.trim(), coin: selectedPayment }),
    })
    const json = await res.json()
    if (res.ok) {
      toast.success('TX hash submitted! We will verify your payment shortly.')
      router.push(`/account/orders/${createdOrderId}?new=1`)
    } else {
      toast.error(json.message ?? 'Failed to submit TX hash')
    }
  }

  // Crypto wallet panel (shown after order created)
  if (createdOrderId && isCrypto) {
    const address = CRYPTO_ADDRESSES[selectedPayment] ?? ''
    const coinLabel = CRYPTO_LABELS[selectedPayment] ?? selectedPayment
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <div className="bg-card border border-border rounded-2xl p-8 space-y-6 text-center">
          <Bitcoin className="w-12 h-12 text-amber-500 mx-auto" />
          <div>
            <h2 className="text-2xl font-bold mb-1">Send {coinLabel}</h2>
            <p className="text-muted-foreground text-sm">Order <span className="font-mono">{createdOrderRef}</span> · ${total.toLocaleString()}</p>
          </div>
          <div className="bg-muted rounded-xl p-4 text-left space-y-2">
            <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wide">Wallet Address</p>
            <div className="flex items-center gap-2">
              <code className="text-xs break-all flex-1 select-all">{address}</code>
              <button
                onClick={() => { navigator.clipboard.writeText(address); toast.success('Copied!') }}
                className="shrink-0 p-1.5 hover:bg-accent rounded"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Send <strong className="text-foreground">₦{total.toLocaleString()} worth of {coinLabel}</strong> to the address above, then paste your transaction hash below.
            <span className="block mt-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
              ≈ ${(total / 1600).toFixed(2)} USD at ₦1,600/$1 rate
            </span>
          </p>
          <div className="space-y-3 text-left">
            <Label>Transaction Hash (TX ID)</Label>
            <Input
              placeholder="0x… or txid…"
              value={cryptoTxHash}
              onChange={e => setCryptoTxHash(e.target.value)}
            />
            <Button className="w-full gap-2" onClick={submitCryptoHash} disabled={!cryptoTxHash.trim()}>
              <Send className="w-4 h-4" /> Confirm Payment
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Verification takes 1–30 minutes depending on network congestion.</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-page-reveal">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        {/* Steps */}
        <div className="flex items-center gap-4 mb-10">
          {(['address', 'payment'] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono border-2 ${step === s || (s === 'address' && step === 'payment') ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'}`}>
                {i + 1}
              </div>
              <span className={`text-sm font-medium capitalize ${step === s ? 'text-foreground' : 'text-muted-foreground'}`}>{s}</span>
              {i < 1 && <div className="w-8 h-px bg-border" />}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-2 flex flex-col gap-6">
            {/* Shipping */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="font-bold text-base flex items-center gap-2 mb-5">
                <Truck className="w-4 h-4 text-primary" /> Shipping Address
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <FormField label="Full Name" error={errors.fullName?.message}>
                    <Input {...register('fullName')} placeholder="Alex Johnson" autoComplete="name" />
                  </FormField>
                </div>
                <div className="sm:col-span-2">
                  <FormField label="Address Line 1" error={errors.line1?.message}>
                    <Input {...register('line1')} placeholder="123 Main St" autoComplete="address-line1" />
                  </FormField>
                </div>
                <div className="sm:col-span-2">
                  <FormField label="Address Line 2 (optional)" error={errors.line2?.message}>
                    <Input {...register('line2')} placeholder="Apt 4B" autoComplete="address-line2" />
                  </FormField>
                </div>
                <FormField label="City / LGA" error={errors.city?.message}>
                  <Input {...register('city')} placeholder="Ikeja" autoComplete="address-level2" />
                </FormField>
                <FormField label="State" error={errors.state?.message}>
                  <select
                    {...register('state')}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Select state…</option>
                    {shippingRates.map(r => (
                      <option key={r.state} value={r.state}>{r.state}</option>
                    ))}
                    <option value="Other">Other / International</option>
                  </select>
                </FormField>
                <FormField label="Country" error={errors.country?.message}>
                  <Input {...register('country')} placeholder="Nigeria" autoComplete="country" />
                </FormField>
                <FormField label="Postal Code (optional)" error={errors.postalCode?.message}>
                  <Input {...register('postalCode')} placeholder="100001" autoComplete="postal-code" />
                </FormField>
                <div className="sm:col-span-2">
                  <FormField label="Phone Number" error={errors.phone?.message}>
                    <Input {...register('phone')} placeholder="+234 800 000 0000" autoComplete="tel" type="tel" />
                  </FormField>
                </div>
              </div>
            </div>

            {/* Shipping cost display */}
            {selectedRate && (
              <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">Delivery to {selectedRate.state}</p>
                  <p className="text-xs text-muted-foreground">{selectedRate.estimatedDays} business day{selectedRate.estimatedDays !== 1 ? 's' : ''} estimated</p>
                </div>
                <span className="font-bold text-sm">₦{Number(selectedRate.price).toLocaleString()}</span>
              </div>
            )}
            {watchedState === 'Other' && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm text-amber-800 dark:text-amber-300">
                International shipping — we will contact you with a quote after placing your order.
              </div>
            )}

            {/* Payment */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="font-bold text-base flex items-center gap-2 mb-5">
                <CreditCard className="w-4 h-4 text-primary" /> Payment Method
              </h2>
              <div className="flex flex-col gap-3">
                {PAYMENT_METHODS.map(m => {
                  const Icon = m.icon
                  const active = selectedPayment === m.id
                  return (
                    <label
                      key={m.id}
                      className={`flex items-center gap-3 border rounded-xl px-4 py-3.5 cursor-pointer transition-all ${active ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:bg-accent'}`}
                    >
                      <input type="radio" value={m.id} {...register('paymentMethod')} className="sr-only" />
                      <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold leading-none">{m.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
                      </div>
                      {active && <CheckCircle className="w-4 h-4 text-primary shrink-0" />}
                    </label>
                  )
                })}
              </div>
              {errors.paymentMethod && <p className="text-destructive text-xs mt-2">{errors.paymentMethod.message}</p>}
              {isCrypto && (
                <div className="mt-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3 text-sm text-amber-800 dark:text-amber-300">
                  After placing the order you'll see the wallet address and can paste your TX hash.
                </div>
              )}
            </div>

            <Button type="submit" disabled={isSubmitting} size="lg" className="w-full font-semibold">
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Processing…
                </span>
              ) : selectedPayment === 'paystack' ? (
                `Pay ₦${orderTotal.toLocaleString()} with Paystack →`
              ) : isCrypto ? (
                `Place Order & Pay with Crypto →`
              ) : (
                `Place Order — ₦${orderTotal.toLocaleString()}`
              )}
            </Button>
          </form>

          <div>
            <CheckoutSummary />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
