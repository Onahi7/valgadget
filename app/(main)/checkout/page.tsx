'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import {
  CreditCard, Truck, CheckCircle, Bitcoin, Wallet, Copy, Send, Loader2, MapPin, Plus, BookmarkCheck, Mail,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { CheckoutSummary } from '@/components/ecommerce/checkout-summary'
import { useAuth } from '@/contexts/auth-context'
import { useCart } from '@/contexts/cart-context'
import { orderService } from '@/lib/services/order.service'
import { addressService, type UserAddress } from '@/lib/services/address.service'
import { NIGERIA_STATES_LGAS, getLGAsForState } from '@/lib/data/nigeria-locations'
import { toast } from 'sonner'
import { getToken } from '@/lib/api-client'
import type { ApiError } from '@/lib/api-client'

interface ShippingRate { id: string; state: string; price: string; estimatedDays: number }

const addressSchema = z.object({
  fullName: z.string().min(2, 'Required'),
  line1: z.string().min(3, 'Required'),
  line2: z.string().optional(),
  city: z.string().min(2, 'Select LGA'),
  state: z.string().min(1, 'Select your state'),
  postalCode: z.string().optional(),
  country: z.string().min(2, 'Required'),
  phone: z.string().min(6, 'Required'),
  paymentMethod: z.string().min(1, 'Select a payment method'),
  saveAddress: z.boolean().optional(),
  addressLabel: z.string().optional(),
  guestEmail: z.string().email('Valid email required').optional(),
})
type FormValues = z.infer<typeof addressSchema>

const PAYMENT_METHODS = [
  { id: 'paystack',   label: 'Pay with Paystack',        icon: CreditCard, desc: 'Cards, bank transfer, USSD & more' },
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
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <CheckoutPageContent />
    </Suspense>
  )
}

function CheckoutPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const affiliateCode = searchParams.get('ref') ?? undefined
  const { items, total, clearCart } = useCart()
  const { user } = useAuth()
  const [cryptoTxHash, setCryptoTxHash] = useState('')
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null)
  const [createdOrderRef, setCreatedOrderRef] = useState<string | null>(null)
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([])
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null)
  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [showNewAddressForm, setShowNewAddressForm] = useState(false)

  // Load saved addresses (only for logged-in users)
  useEffect(() => {
    if (!user) return
    addressService.getAll()
      .then(res => {
        setSavedAddresses(res.data)
        // Auto-select default address
        const defaultAddr = res.data.find(a => a.isDefault)
        if (defaultAddr && !showNewAddressForm) {
          setSelectedAddressId(defaultAddr.id)
        }
      })
      .catch(() => {})
  }, [showNewAddressForm, user])

  useEffect(() => {
    fetch('/api/shipping-rates').then(r => r.json()).then(j => {
      if (j.data) setShippingRates(j.data)
    }).catch(() => {})
  }, [])

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: { country: 'Nigeria', paymentMethod: 'paystack', saveAddress: false, guestEmail: '' },
  })

  const selectedPayment = watch('paymentMethod')
  const watchedState = watch('state')
  const watchedSaveAddress = watch('saveAddress')
  const isCrypto = false
  const step = selectedPayment ? 'payment' : 'address'

  // Get LGAs for selected state
  const availableLGAs = watchedState ? getLGAsForState(watchedState) : []

  // Auto-select shipping rate when state changes
  useEffect(() => {
    if (watchedState && shippingRates.length) {
      const rate = shippingRates.find(r => r.state === watchedState) ?? null
      setSelectedRate(rate)
    }
  }, [watchedState, shippingRates])

  // Fill form when saved address is selected
  useEffect(() => {
    if (selectedAddressId && !showNewAddressForm) {
      const addr = savedAddresses.find(a => a.id === selectedAddressId)
      if (addr) {
        setValue('fullName', addr.fullName)
        setValue('line1', addr.line1)
        setValue('line2', addr.line2 || '')
        setValue('city', addr.city)
        setValue('state', addr.state)
        setValue('postalCode', addr.postalCode || '')
        setValue('country', addr.country)
        setValue('phone', addr.phone)
      }
    }
  }, [selectedAddressId, savedAddresses, setValue, showNewAddressForm])

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
      // Validate guest email if not logged in
      if (!user && !data.guestEmail) {
        toast.error('Please provide your email address')
        return
      }

      // Save address if requested (only for logged-in users)
      if (user && data.saveAddress && showNewAddressForm) {
        try {
          await addressService.create({
            label: data.addressLabel || 'Home',
            fullName: data.fullName,
            line1: data.line1,
            line2: data.line2,
            city: data.city,
            state: data.state,
            postalCode: data.postalCode,
            country: data.country,
            phone: data.phone,
            isDefault: savedAddresses.length === 0, // First address is default
          })
          toast.success('Address saved!')
        } catch (err) {
          console.error('Failed to save address:', err)
        }
      }

      const order = await orderService.create({
        items: items.map(i => ({ productId: i.product.id, quantity: i.quantity })),
        shippingAddress: {
          fullName: data.fullName, line1: data.line1, line2: data.line2,
          city: data.city, state: data.state, postalCode: data.postalCode ?? '',
          country: data.country, phone: data.phone,
        },
        paymentMethod: 'paystack',
        affiliateCode,
        guestEmail: user ? undefined : data.guestEmail,
      })

      clearCart()
      setCreatedOrderId(order.id)
      setCreatedOrderRef(order.reference)

      if (data.paymentMethod === 'paystack') {
        const token = getToken()
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (token) headers.Authorization = `Bearer ${token}`
        const res = await fetch('/api/payments/paystack/initialize', {
          method: 'POST',
          headers,
          body: JSON.stringify({ orderId: order.id, guestEmail: user ? undefined : data.guestEmail }),
        })
        const json = await res.json()
        const authorizationUrl = json?.authorization_url ?? json?.data?.authorization_url
        if (authorizationUrl) {
          toast.success('Redirecting to Paystack…')
          window.location.href = authorizationUrl
          return
        }
        toast.error(json.message ?? 'Paystack init failed')
        return
      }

      toast.error('Only Paystack checkout is currently available.')
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

  // Crypto wallet panel
  if (createdOrderId && isCrypto) {
    const address = CRYPTO_ADDRESSES[selectedPayment] ?? ''
    const coinLabel = CRYPTO_LABELS[selectedPayment] ?? selectedPayment
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <div className="bg-card border border-border rounded-2xl p-8 space-y-6 text-center">
          <Bitcoin className="w-12 h-12 text-amber-500 mx-auto" />
          <div>
            <h2 className="text-2xl font-bold mb-1">Send {coinLabel}</h2>
            <p className="text-muted-foreground text-sm">Order <span className="font-mono">{createdOrderRef}</span> · ₦{total.toLocaleString()}</p>
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
              Send <strong className="text-foreground">₦{orderTotal.toLocaleString()}</strong> to the address above, then paste your transaction hash below.
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
          {/* Guest Email (if not logged in) */}
          {!user && (
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="font-bold text-base flex items-center gap-2 mb-5">
                <Mail className="w-4 h-4 text-primary" /> Contact Information
              </h2>
              <FormField label="Email Address" error={errors.guestEmail?.message}>
                <Input 
                  {...register('guestEmail')} 
                  type="email"
                  placeholder="your@email.com" 
                  autoComplete="email"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  We'll send your order confirmation here
                </p>
              </FormField>
              <div className="mt-4 text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href={`/login?returnUrl=/checkout${affiliateCode ? `?ref=${affiliateCode}` : ''}`} className="text-primary hover:underline">
                  Sign in
                </Link>
              </div>
            </div>
          )}

          {/* Saved Addresses */}
          {user && savedAddresses.length > 0 && !showNewAddressForm && (
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-base flex items-center gap-2">
                    <BookmarkCheck className="w-4 h-4 text-primary" /> Saved Addresses
                  </h2>
                  <Link href="/account/addresses" className="text-xs text-primary hover:underline">
                    Manage
                  </Link>
                </div>
                <div className="flex flex-col gap-2">
                  {savedAddresses.map(addr => (
                    <label
                      key={addr.id}
                      className={`flex items-start gap-3 border rounded-lg px-4 py-3 cursor-pointer transition-all ${selectedAddressId === addr.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent'}`}
                    >
                      <input
                        type="radio"
                        name="savedAddress"
                        value={addr.id}
                        checked={selectedAddressId === addr.id}
                        onChange={() => setSelectedAddressId(addr.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{addr.label} {addr.isDefault && <span className="text-xs text-muted-foreground">(Default)</span>}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {addr.fullName} · {addr.line1}, {addr.city}, {addr.state} · {addr.phone}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full mt-3"
                  onClick={() => { setShowNewAddressForm(true); setSelectedAddressId('') }}
                >
                  <Plus className="w-4 h-4 mr-2" /> Use New Address
                </Button>
              </div>
            )}

            {/* Shipping Address Form */}
            {((!user || savedAddresses.length === 0) || showNewAddressForm) && (
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-bold text-base flex items-center gap-2">
                    <Truck className="w-4 h-4 text-primary" /> Shipping Address
                  </h2>
                  {showNewAddressForm && savedAddresses.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => { setShowNewAddressForm(false); setSelectedAddressId(savedAddresses.find(a => a.isDefault)?.id || savedAddresses[0]?.id || '') }}
                    >
                      Use Saved
                    </Button>
                  )}
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <FormField label="Full Name" error={errors.fullName?.message}>
                      <Input {...register('fullName')} placeholder="Alex Johnson" autoComplete="name" />
                    </FormField>
                  </div>
                  <div className="sm:col-span-2">
                    <FormField label="Address Line 1" error={errors.line1?.message}>
                      <Input {...register('line1')} placeholder="123 Main Street" autoComplete="address-line1" />
                    </FormField>
                  </div>
                  <div className="sm:col-span-2">
                    <FormField label="Address Line 2 (optional)" error={errors.line2?.message}>
                      <Input {...register('line2')} placeholder="Apt 4B, Floor 2" autoComplete="address-line2" />
                    </FormField>
                  </div>
                  <FormField label="State" error={errors.state?.message}>
                    <select
                      {...register('state')}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
                      onChange={(e) => {
                        setValue('state', e.target.value)
                        setValue('city', '') // Reset LGA when state changes
                      }}
                    >
                      <option value="">Select state…</option>
                      {NIGERIA_STATES_LGAS.map(loc => (
                        <option key={loc.state} value={loc.state}>{loc.state}</option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="LGA (Local Government Area)" error={errors.city?.message}>
                    <select
                      {...register('city')}
                      disabled={!watchedState}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                    >
                      <option value="">Select LGA…</option>
                      {availableLGAs.map(lga => (
                        <option key={lga} value={lga}>{lga}</option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Phone Number" error={errors.phone?.message}>
                    <Input {...register('phone')} placeholder="+234 800 000 0000" autoComplete="tel" type="tel" />
                  </FormField>
                  <FormField label="Postal Code (optional)" error={errors.postalCode?.message}>
                    <Input {...register('postalCode')} placeholder="100001" autoComplete="postal-code" />
                  </FormField>
                  
                  {/* Save Address Option (only for logged-in users) */}
                  {user && showNewAddressForm && (
                    <>
                      <div className="sm:col-span-2 flex items-center gap-2 pt-2">
                        <Checkbox
                          id="saveAddress"
                          checked={watchedSaveAddress}
                          onCheckedChange={(checked) => setValue('saveAddress', !!checked)}
                        />
                        <Label htmlFor="saveAddress" className="text-sm cursor-pointer">
                          Save this address for future orders
                        </Label>
                      </div>
                      {watchedSaveAddress && (
                        <div className="sm:col-span-2">
                          <FormField label="Address Label" error={errors.addressLabel?.message}>
                            <Input {...register('addressLabel')} placeholder="Home, Office, etc." />
                          </FormField>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

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

            {/* Order Review (shows when payment method selected) */}
            {selectedPayment && (
              <div className="bg-card rounded-xl border border-primary/20 p-6">
                <h2 className="font-bold text-base flex items-center gap-2 mb-5">
                  <CheckCircle className="w-4 h-4 text-primary" /> Review Your Order
                </h2>
                
                {/* Order Items Summary */}
                <div className="space-y-3 mb-4">
                  <p className="text-sm font-semibold text-muted-foreground">Items ({items.length})</p>
                  {items.slice(0, 3).map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="truncate flex-1">{item.product.name} × {item.quantity}</span>
                      <span className="font-medium ml-2">₦{(item.product.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                  {items.length > 3 && (
                    <p className="text-xs text-muted-foreground">+ {items.length - 3} more item{items.length - 3 !== 1 ? 's' : ''}</p>
                  )}
                </div>

                {/* Shipping Address Summary */}
                {(watchedState || selectedAddressId) && (
                  <div className="border-t pt-4 mb-4">
                    <p className="text-sm font-semibold text-muted-foreground mb-2">Shipping To</p>
                    <p className="text-sm">
                      {watch('fullName') || savedAddresses.find(a => a.id === selectedAddressId)?.fullName}<br />
                      {watch('line1') || savedAddresses.find(a => a.id === selectedAddressId)?.line1}<br />
                      {watch('city') || savedAddresses.find(a => a.id === selectedAddressId)?.city}, {watch('state') || savedAddresses.find(a => a.id === selectedAddressId)?.state}
                    </p>
                  </div>
                )}

                {/* Total */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold">Total Amount</span>
                    <span className="font-bold text-lg text-primary">₦{orderTotal.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Including ₦{shippingCost.toLocaleString()} shipping
                  </p>
                </div>
              </div>
            )}

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
            <CheckoutSummary shipping={shippingCost} />
          </div>
        </div>
      </div>
    )
  }
