'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Bitcoin,
  BookmarkCheck,
  CheckCircle2,
  Copy,
  CreditCard,
  Loader2,
  Mail,
  MapPin,
  PackageOpen,
  Plus,
  Send,
  ShieldCheck,
  Truck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { CheckoutSummary } from '@/components/ecommerce/checkout-summary'
import { useAuth } from '@/contexts/auth-context'
import { useCart } from '@/contexts/cart-context'
import { orderService } from '@/lib/services/order.service'
import { paymentService } from '@/lib/services/payment.service'
import { addressService, type UserAddress } from '@/lib/services/address.service'
import { NIGERIA_STATES_LGAS, getLGAsForState } from '@/lib/data/nigeria-locations'
import { toast } from 'sonner'
import type { ApiError } from '@/lib/api-client'
import type { PublicStoreConfig } from '@/lib/store-settings'

interface ShippingRate {
  id: string
  state: string
  price: string
  estimatedDays: number
}

type CryptoAddresses = {
  btc: string
  eth: string
  usdt_erc20: string
  usdt_trc20: string
}

const EMPTY_CRYPTO_ADDRESSES: CryptoAddresses = {
  btc: '',
  eth: '',
  usdt_erc20: '',
  usdt_trc20: '',
}

const DEFAULT_PUBLIC_CONFIG: PublicStoreConfig = {
  storeName: 'Val Gadgets',
  storeEmail: 'support@valgadgets.com',
  storePhone: '+234 703 857 2046',
  shippingEnabled: true,
  freeShippingEnabled: true,
  freeShippingThreshold: 500000,
  taxEnabled: false,
  taxRate: 0,
  pricesIncludeTax: true,
  paymentMethods: { paystack: true, cod: true, btc: false, eth: false, usdtTrc20: false, usdtErc20: false },
}

const CRYPTO_METHODS = [
  { id: 'btc', label: 'Bitcoin', description: 'Send BTC to the displayed wallet' },
  { id: 'eth', label: 'Ethereum', description: 'Send ETH on the Ethereum network' },
  { id: 'usdt_trc20', label: 'USDT (TRC-20)', description: 'Send USDT on the Tron network' },
  { id: 'usdt_erc20', label: 'USDT (ERC-20)', description: 'Send USDT on the Ethereum network' },
] as const

const CRYPTO_LABELS: Record<string, string> = {
  btc: 'BTC',
  eth: 'ETH',
  usdt_trc20: 'USDT (TRC-20)',
  usdt_erc20: 'USDT (ERC-20)',
}

const checkoutSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name'),
  line1: z.string().trim().min(5, 'Enter a complete street address'),
  line2: z.string().trim().optional(),
  city: z.string().min(2, 'Select your LGA'),
  state: z.string().min(1, 'Select your state'),
  postalCode: z.string().trim().optional(),
  country: z.string().min(2, 'Country is required'),
  phone: z.string().trim().refine(value => {
    const digits = value.replace(/\D/g, '')
    return /^(?:234[789]\d{9}|0[789]\d{9})$/.test(digits)
  }, 'Enter a valid Nigerian phone number'),
  paymentMethod: z.string().min(1, 'Select a payment method'),
  saveAddress: z.boolean().optional(),
  addressLabel: z.string().trim().optional(),
  guestEmail: z.preprocess(
    value => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().email('Enter a valid email address').optional(),
  ),
})

type FormValues = z.infer<typeof checkoutSchema>
type CheckoutStep = 'delivery' | 'payment'

const fieldClassName = 'h-11 rounded-lg border-slate-300 bg-white px-3 text-[15px] text-slate-950 shadow-none placeholder:text-slate-400 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15'
const selectClassName = 'flex h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-[15px] text-slate-950 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400'

function FormField({ label, htmlFor, error, children }: { label: string; htmlFor: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-sm font-medium text-slate-800">{label}</Label>
      {children}
      {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  )
}

function CheckoutLoading() {
  return (
    <div className="flex min-h-[520px] items-center justify-center bg-slate-50">
      <Loader2 className="h-6 w-6 animate-spin text-primary" aria-label="Loading checkout" />
    </div>
  )
}

function EmptyCheckout() {
  return (
    <div className="mx-auto flex min-h-[620px] max-w-xl flex-col items-center justify-center px-4 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-primary">
        <PackageOpen className="h-8 w-8" />
      </span>
      <h1 className="mt-6 text-3xl font-bold text-slate-950">Your cart is empty</h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
        Add a gadget to your cart before starting checkout. Your saved items will still be waiting in your wishlist.
      </p>
      <Button className="mt-7 h-11 rounded-lg px-6 font-semibold" asChild>
        <Link href="/shop">Browse gadgets <ArrowRight className="h-4 w-4" /></Link>
      </Button>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutLoading />}>
      <CheckoutPageContent />
    </Suspense>
  )
}

function CheckoutPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const affiliateCode = searchParams.get('ref') ?? undefined
  const { items, subtotal, total, couponCode, clearCart, isHydrated } = useCart()
  const { user, isLoading: authIsLoading } = useAuth()
  const [step, setStep] = useState<CheckoutStep>('delivery')
  const [cryptoTxHash, setCryptoTxHash] = useState('')
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null)
  const [createdOrderRef, setCreatedOrderRef] = useState<string | null>(null)
  const [createdOrderTotal, setCreatedOrderTotal] = useState(0)
  const [guestAccessToken, setGuestAccessToken] = useState('')
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([])
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null)
  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [showNewAddressForm, setShowNewAddressForm] = useState(false)
  const [initializingPayment, setInitializingPayment] = useState(false)
  const [cryptoAddresses, setCryptoAddresses] = useState<CryptoAddresses>(EMPTY_CRYPTO_ADDRESSES)
  const [storeConfig, setStoreConfig] = useState<PublicStoreConfig>(DEFAULT_PUBLIC_CONFIG)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      country: 'Nigeria',
      paymentMethod: 'paystack',
      saveAddress: false,
      guestEmail: '',
    },
  })

  const selectedPayment = watch('paymentMethod')
  const watchedState = watch('state')
  const watchedSaveAddress = watch('saveAddress')
  const availableLGAs = watchedState ? getLGAsForState(watchedState) : []
  const qualifiesForFreeShipping = storeConfig.freeShippingEnabled && subtotal >= storeConfig.freeShippingThreshold
  const shippingCost = !storeConfig.shippingEnabled || qualifiesForFreeShipping ? 0 : selectedRate ? Number(selectedRate.price) : 0
  const tax = storeConfig.taxEnabled && !storeConfig.pricesIncludeTax ? Math.round(total * storeConfig.taxRate) / 100 : 0
  const orderTotal = total + shippingCost + tax
  const isCrypto = CRYPTO_METHODS.some(method => method.id === selectedPayment)

  const paymentMethods = useMemo(() => {
    const methods = []
    if (storeConfig.paymentMethods.paystack) {
      methods.push({ id: 'paystack', label: 'Pay with Paystack', description: 'Card, bank transfer, USSD and more', icon: CreditCard })
    }
    if (storeConfig.paymentMethods.cod) {
      methods.push({ id: 'cod', label: 'Cash on delivery', description: 'Pay when your order arrives', icon: Truck })
    }
    if (!user) return methods
    return [
      ...methods,
      ...CRYPTO_METHODS
        .filter(method => {
          const enabled = method.id === 'btc' ? storeConfig.paymentMethods.btc
            : method.id === 'eth' ? storeConfig.paymentMethods.eth
              : method.id === 'usdt_trc20' ? storeConfig.paymentMethods.usdtTrc20
                : storeConfig.paymentMethods.usdtErc20
          return enabled && cryptoAddresses[method.id]
        })
        .map(method => ({ ...method, icon: Bitcoin })),
    ]
  }, [cryptoAddresses, storeConfig.paymentMethods, user])

  useEffect(() => {
    Promise.all([
      fetch('/api/shipping-rates').then(response => response.ok ? response.json() : Promise.reject()),
      fetch('/api/store-config').then(response => response.ok ? response.json() : Promise.reject()),
    ])
      .then(([rates, config]) => {
        if (Array.isArray(rates)) setShippingRates(rates)
        if (config && typeof config === 'object') setStoreConfig(config)
      })
      .catch(() => toast.error('We could not load delivery rates. Please refresh and try again.'))
  }, [])

  useEffect(() => {
    if (authIsLoading || !user) return
    addressService.getAll()
      .then(response => {
        setSavedAddresses(response.data)
        const preferred = response.data.find(address => address.isDefault) ?? response.data[0]
        if (preferred && !showNewAddressForm) setSelectedAddressId(preferred.id)
      })
      .catch(() => toast.error('Saved addresses could not be loaded. You can enter a new one.'))
  }, [authIsLoading, showNewAddressForm, user])

  useEffect(() => {
    if (!user) {
      setCryptoAddresses(EMPTY_CRYPTO_ADDRESSES)
      return
    }
    fetch('/api/payments/crypto')
      .then(response => response.json())
      .then(json => setCryptoAddresses({ ...EMPTY_CRYPTO_ADDRESSES, ...json }))
      .catch(() => setCryptoAddresses(EMPTY_CRYPTO_ADDRESSES))
  }, [user])

  useEffect(() => {
    if (!paymentMethods.some(method => method.id === selectedPayment)) {
      setValue('paymentMethod', paymentMethods[0]?.id ?? '')
    }
  }, [paymentMethods, selectedPayment, setValue])

  useEffect(() => {
    if (!watchedState || shippingRates.length === 0) {
      setSelectedRate(null)
      return
    }
    setSelectedRate(shippingRates.find(rate => rate.state === watchedState) ?? null)
  }, [shippingRates, watchedState])

  useEffect(() => {
    if (!selectedAddressId || showNewAddressForm) return
    const address = savedAddresses.find(item => item.id === selectedAddressId)
    if (!address) return
    setValue('fullName', address.fullName)
    setValue('line1', address.line1)
    setValue('line2', address.line2 || '')
    setValue('city', address.city)
    setValue('state', address.state)
    setValue('postalCode', address.postalCode || '')
    setValue('country', address.country)
    setValue('phone', address.phone)
  }, [savedAddresses, selectedAddressId, setValue, showNewAddressForm])

  if (!isHydrated || authIsLoading) return <CheckoutLoading />
  if (items.length === 0 && !createdOrderId) return <EmptyCheckout />

  const checkoutReturnUrl = `/checkout${affiliateCode ? `?ref=${affiliateCode}` : ''}`

  const continueToPayment = async () => {
    if (user && savedAddresses.length > 0 && !showNewAddressForm && !selectedAddressId) {
      toast.error('Select a saved address or enter a new one.')
      return
    }

    const deliveryFields: (keyof FormValues)[] = ['fullName', 'line1', 'city', 'state', 'country', 'phone']
    if (!user) deliveryFields.push('guestEmail')
    const valid = await trigger(deliveryFields, { shouldFocus: true })
    if (!valid) return

    if (storeConfig.shippingEnabled && !selectedRate) {
      toast.error('A delivery rate is not available for the selected state yet.')
      return
    }

    setStep('payment')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const onSubmit = async (data: FormValues) => {
    if (step !== 'payment') {
      await continueToPayment()
      return
    }
    if (storeConfig.shippingEnabled && !selectedRate) {
      toast.error('Select a valid delivery address before paying.')
      setStep('delivery')
      return
    }
    if (!user && !data.guestEmail) {
      toast.error('Enter the email address for your order receipt.')
      setStep('delivery')
      return
    }
    if (isCrypto && (!user || !cryptoAddresses[data.paymentMethod as keyof CryptoAddresses])) {
      toast.error('That crypto payment option is not available.')
      return
    }

    try {
      if (user && data.saveAddress && showNewAddressForm) {
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
          isDefault: savedAddresses.length === 0,
        }).catch(() => toast.error('The order can continue, but this address was not saved.'))
      }

      let orderId = createdOrderId
      let orderReference = createdOrderRef
      let orderGuestToken = guestAccessToken

      if (!orderId) {
        const order = await orderService.create({
          items: items.map(item => ({ productId: item.product.id, quantity: item.quantity })),
          shippingAddress: {
            fullName: data.fullName,
            line1: data.line1,
            line2: data.line2,
            city: data.city,
            state: data.state,
            postalCode: data.postalCode ?? '',
            country: data.country,
            phone: data.phone,
          },
          paymentMethod: isCrypto ? 'crypto' : data.paymentMethod,
          couponCode: couponCode ?? undefined,
          affiliateCode,
          guestEmail: user ? undefined : data.guestEmail,
        })
        orderId = order.id
        orderReference = order.reference
        setCreatedOrderId(order.id)
        setCreatedOrderRef(order.reference)
        setCreatedOrderTotal(order.total)
        setGuestAccessToken(order.guestAccessToken ?? '')
        orderGuestToken = order.guestAccessToken ?? ''
      }

      if (data.paymentMethod === 'paystack') {
        setInitializingPayment(true)
        const destination = user ? `/account/orders/${orderId}` : `/orders/guest/${orderId}?token=${encodeURIComponent(orderGuestToken)}`
        const intent = await paymentService.initiate({
          orderId,
          method: 'card',
          returnUrl: `${window.location.origin}${destination}?paid=1`,
          cancelUrl: `${window.location.origin}${destination}?payment=cancelled`,
          guestEmail: user ? undefined : data.guestEmail,
        })
        if (!intent.redirectUrl) throw new Error('Payment provider did not return a checkout URL')
        clearCart()
        toast.success('Opening secure Paystack checkout…')
        window.location.assign(intent.redirectUrl)
        return
      }

      if (data.paymentMethod === 'cod') {
        clearCart()
        toast.success('Order confirmed. You can pay when it arrives.')
        router.push(user ? `/account/orders/${orderId}?new=1` : `/orders/guest/${orderId}?token=${encodeURIComponent(orderGuestToken)}&new=1`)
        return
      }

      setCreatedOrderId(orderId)
      setCreatedOrderRef(orderReference)
      clearCart()
      toast.success('Order placed. Complete the crypto transfer below.')
    } catch (error) {
      const apiError = error as ApiError
      toast.error(apiError.message ?? 'Checkout could not be completed. Your cart is still available.')
    } finally {
      setInitializingPayment(false)
    }
  }

  const submitCryptoHash = async () => {
    if (!cryptoTxHash.trim() || !createdOrderId) return
    const response = await fetch('/api/payments/crypto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-requested-with': 'XMLHttpRequest' },
      credentials: 'include',
      body: JSON.stringify({ orderId: createdOrderId, txHash: cryptoTxHash.trim(), coin: selectedPayment }),
    })
    const json = await response.json()
    if (!response.ok) {
      toast.error(json.message ?? 'The transaction hash could not be submitted.')
      return
    }
    toast.success('Transaction hash received. We will verify it shortly.')
    router.push(`/account/orders/${createdOrderId}?new=1`)
  }

  if (createdOrderId && isCrypto) {
    const address = cryptoAddresses[selectedPayment as keyof CryptoAddresses] ?? ''
    const coinLabel = CRYPTO_LABELS[selectedPayment] ?? selectedPayment
    return (
      <div className="mx-auto max-w-xl px-4 py-12 sm:py-16">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.07)] sm:p-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-primary">
            <Bitcoin className="h-6 w-6" />
          </span>
          <h1 className="mt-5 text-3xl font-bold text-slate-950">Send {coinLabel}</h1>
          <p className="mt-2 text-sm text-slate-500">Order {createdOrderRef} · ₦{createdOrderTotal.toLocaleString('en-NG')}</p>

          <div className="mt-7 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Wallet address</p>
            <div className="mt-2 flex items-center gap-3">
              <code className="min-w-0 flex-1 break-all text-xs text-slate-900">{address}</code>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(address).then(() => toast.success('Wallet address copied'))}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-primary"
                aria-label="Copy wallet address"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <Label htmlFor="cryptoTxHash" className="text-sm font-medium text-slate-800">Transaction hash (TX ID)</Label>
            <Input id="cryptoTxHash" className={fieldClassName} placeholder="Paste the transaction hash" value={cryptoTxHash} onChange={event => setCryptoTxHash(event.target.value)} />
            <Button className="h-11 w-full rounded-lg font-semibold" onClick={submitCryptoHash} disabled={!cryptoTxHash.trim()}>
              <Send className="h-4 w-4" /> Submit transaction hash
            </Button>
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500">Verification usually takes 1–30 minutes depending on network congestion.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50/70 py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-slate-950">Checkout</h1>
          <div className="mt-5 grid max-w-2xl grid-cols-[auto_1fr_auto] items-center gap-3 text-sm">
            <button type="button" onClick={() => setStep('delivery')} className="inline-flex items-center gap-2 font-semibold text-slate-950">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                {step === 'payment' ? <CheckCircle2 className="h-4 w-4" /> : '1'}
              </span>
              Delivery
            </button>
            <span className={`h-px ${step === 'payment' ? 'bg-primary' : 'bg-slate-300'}`} />
            <span className={`inline-flex items-center gap-2 font-semibold ${step === 'payment' ? 'text-slate-950' : 'text-slate-400'}`}>
              <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${step === 'payment' ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'}`}>2</span>
              Payment
            </span>
          </div>
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.75fr)]">
          <form onSubmit={handleSubmit(onSubmit)}>
            {step === 'delivery' ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.04)] sm:p-7">
                <section>
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="text-xl font-bold text-slate-950">Contact</h2>
                    {!user ? (
                      <Link href={`/login?returnUrl=${encodeURIComponent(checkoutReturnUrl)}`} className="text-sm font-semibold text-primary hover:underline">Sign in</Link>
                    ) : null}
                  </div>
                  <div className="mt-5">
                    {user ? (
                      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <Mail className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{user.email}</p>
                          <p className="text-xs text-slate-500">Order updates will be sent here</p>
                        </div>
                      </div>
                    ) : selectedPayment === 'cod' ? (
                      <>Confirm cash-on-delivery order <ArrowRight className="h-4 w-4" /></>
                    ) : (
                      <FormField label="Email address" htmlFor="guestEmail" error={errors.guestEmail?.message}>
                        <Input id="guestEmail" type="email" autoComplete="email" placeholder="you@example.com" className={fieldClassName} {...register('guestEmail')} />
                      </FormField>
                    )}
                  </div>
                </section>

                <div className="my-7 h-px bg-slate-200" />

                <section>
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="text-xl font-bold text-slate-950">Delivery address</h2>
                    <Truck className="h-5 w-5 text-primary" />
                  </div>

                  {user && savedAddresses.length > 0 && !showNewAddressForm ? (
                    <div className="mt-5 space-y-3">
                      {savedAddresses.map(address => (
                        <label key={address.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${selectedAddressId === address.id ? 'border-primary bg-accent/60 ring-1 ring-primary' : 'border-slate-200 hover:border-slate-300'}`}>
                          <input type="radio" name="savedAddress" value={address.id} checked={selectedAddressId === address.id} onChange={() => setSelectedAddressId(address.id)} className="mt-1 accent-[#324C33]" />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                              <BookmarkCheck className="h-4 w-4 text-primary" /> {address.label}
                              {address.isDefault ? <span className="text-xs font-normal text-slate-500">Default</span> : null}
                            </span>
                            <span className="mt-1 block text-sm leading-6 text-slate-600">{address.fullName} · {address.line1}, {address.city}, {address.state} · {address.phone}</span>
                          </span>
                        </label>
                      ))}
                      <Button type="button" variant="outline" className="h-11 w-full rounded-lg border-slate-300" onClick={() => { setShowNewAddressForm(true); setSelectedAddressId('') }}>
                        <Plus className="h-4 w-4" /> Use a new address
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      {showNewAddressForm && savedAddresses.length > 0 ? (
                        <div className="sm:col-span-2">
                          <Button type="button" variant="ghost" className="-ml-3 h-9 text-primary" onClick={() => { setShowNewAddressForm(false); setSelectedAddressId(savedAddresses.find(address => address.isDefault)?.id ?? savedAddresses[0]?.id ?? '') }}>
                            <ArrowLeft className="h-4 w-4" /> Use a saved address
                          </Button>
                        </div>
                      ) : null}
                      <div className="sm:col-span-2">
                        <FormField label="Full name" htmlFor="fullName" error={errors.fullName?.message}>
                          <Input id="fullName" autoComplete="name" placeholder="Tunde Adewale" className={fieldClassName} {...register('fullName')} />
                        </FormField>
                      </div>
                      <div className="sm:col-span-2">
                        <FormField label="Street address" htmlFor="line1" error={errors.line1?.message}>
                          <Input id="line1" autoComplete="address-line1" placeholder="12 Admiralty Way" className={fieldClassName} {...register('line1')} />
                        </FormField>
                      </div>
                      <div className="sm:col-span-2">
                        <FormField label="Apartment or landmark (optional)" htmlFor="line2" error={errors.line2?.message}>
                          <Input id="line2" autoComplete="address-line2" placeholder="Flat 4B, near the roundabout" className={fieldClassName} {...register('line2')} />
                        </FormField>
                      </div>
                      <FormField label="State" htmlFor="state" error={errors.state?.message}>
                        <select id="state" className={selectClassName} {...register('state')} onChange={event => { setValue('state', event.target.value, { shouldValidate: true }); setValue('city', '') }}>
                          <option value="">Select state</option>
                          {NIGERIA_STATES_LGAS.map(location => <option key={location.state} value={location.state}>{location.state}</option>)}
                        </select>
                      </FormField>
                      <FormField label="LGA" htmlFor="city" error={errors.city?.message}>
                        <select id="city" className={selectClassName} disabled={!watchedState} {...register('city')}>
                          <option value="">Select LGA</option>
                          {availableLGAs.map(lga => <option key={lga} value={lga}>{lga}</option>)}
                        </select>
                      </FormField>
                      <FormField label="Phone number" htmlFor="phone" error={errors.phone?.message}>
                        <Input id="phone" type="tel" autoComplete="tel" placeholder="0801 234 5678" className={fieldClassName} {...register('phone')} />
                      </FormField>
                      <FormField label="Postal code (optional)" htmlFor="postalCode" error={errors.postalCode?.message}>
                        <Input id="postalCode" autoComplete="postal-code" placeholder="100001" className={fieldClassName} {...register('postalCode')} />
                      </FormField>

                      {user && showNewAddressForm ? (
                        <div className="space-y-3 sm:col-span-2">
                          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                            <Checkbox checked={watchedSaveAddress} onCheckedChange={checked => setValue('saveAddress', Boolean(checked))} />
                            Save this address for future orders
                          </label>
                          {watchedSaveAddress ? (
                            <FormField label="Address label" htmlFor="addressLabel" error={errors.addressLabel?.message}>
                              <Input id="addressLabel" placeholder="Home or Office" className={fieldClassName} {...register('addressLabel')} />
                            </FormField>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  )}

                  {selectedRate ? (
                    <div className="mt-5 flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm">
                      <MapPin className="h-4 w-4 shrink-0 text-primary" />
                      <span className="min-w-0 flex-1 text-slate-600">Delivery to {selectedRate.state} · {selectedRate.estimatedDays} business days</span>
                      <span className="shrink-0 font-semibold text-slate-950">₦{Number(selectedRate.price).toLocaleString('en-NG')}</span>
                    </div>
                  ) : null}
                </section>

                <Button type="button" size="lg" className="mt-7 h-12 w-full rounded-lg text-base font-semibold" onClick={continueToPayment}>
                  Continue to payment <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Delivering to</p>
                      <p className="mt-2 text-sm font-semibold text-slate-950">{watch('fullName')}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{watch('line1')}{watch('line2') ? `, ${watch('line2')}` : ''}<br />{watch('city')}, {watch('state')} · {watch('phone')}</p>
                    </div>
                    <Button type="button" variant="ghost" size="sm" className="text-primary" onClick={() => setStep('delivery')}>Edit</Button>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.04)] sm:p-7">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-950">Payment method</h2>
                      <p className="mt-1 text-sm text-slate-500">Choose how you would like to pay.</p>
                    </div>
                    <ShieldCheck className="h-5 w-5 text-primary" />
                  </div>

                  <div className="mt-6 space-y-3">
                    {paymentMethods.length === 0 ? (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                        No payment method is currently available. Please contact support or try again later.
                      </div>
                    ) : null}
                    {paymentMethods.map(method => {
                      const Icon = method.icon
                      const active = selectedPayment === method.id
                      return (
                        <label key={method.id} className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition ${active ? 'border-primary bg-accent/60 ring-1 ring-primary' : 'border-slate-200 hover:border-slate-300'}`}>
                          <input type="radio" value={method.id} className="sr-only" {...register('paymentMethod')} />
                          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${active ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'}`}><Icon className="h-5 w-5" /></span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-slate-950">{method.label}</span>
                            <span className="mt-0.5 block text-xs text-slate-500">{method.description}</span>
                          </span>
                          {active ? <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" /> : null}
                        </label>
                      )
                    })}
                  </div>

                  <Button type="submit" size="lg" disabled={isSubmitting || initializingPayment || paymentMethods.length === 0} className="mt-7 h-12 w-full rounded-lg text-base font-semibold">
                    {isSubmitting || initializingPayment ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Preparing secure payment…</>
                    ) : selectedPayment === 'paystack' ? (
                      <>Pay ₦{orderTotal.toLocaleString('en-NG')} with Paystack <ArrowRight className="h-4 w-4" /></>
                    ) : (
                      <>Place order and pay with crypto <ArrowRight className="h-4 w-4" /></>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </form>

          <CheckoutSummary shipping={shippingCost} shippingKnown={!storeConfig.shippingEnabled || Boolean(selectedRate)} tax={tax} />
        </div>
      </div>
    </div>
  )
}
