'use client'

import Image from 'next/image'
import Link from 'next/link'
import { LockKeyhole, Minus, Plus } from 'lucide-react'
import { useCart } from '@/contexts/cart-context'
import { Separator } from '@/components/ui/separator'

interface CheckoutSummaryProps {
  shipping?: number
  shippingKnown?: boolean
}

export function CheckoutSummary({ shipping = 0, shippingKnown = false }: CheckoutSummaryProps) {
  const { items, subtotal, discount, total, updateQuantity } = useCart()
  const grandTotal = total + shipping

  return (
    <aside className="sticky top-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] sm:p-6">
      <h2 className="text-xl font-bold text-slate-950">Your order</h2>

      <div className="mt-5 space-y-5">
        {items.map(item => (
          <div key={item.product.id} className="grid grid-cols-[72px_1fr] gap-4">
            <Link href={`/products/${item.product.slug}`} className="relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              <Image
                src={item.product.images[0] ?? '/placeholder-product.svg'}
                alt={item.product.name}
                fill
                sizes="72px"
                className="object-contain p-2"
                unoptimized
              />
            </Link>
            <div className="min-w-0">
              <div className="flex items-start justify-between gap-3">
                <Link href={`/products/${item.product.slug}`} className="line-clamp-2 text-sm font-semibold leading-5 text-slate-900 hover:text-primary">
                  {item.product.name}
                </Link>
                <span className="shrink-0 text-sm font-semibold text-slate-950">
                  ₦{(item.product.price * item.quantity).toLocaleString('en-NG')}
                </span>
              </div>
              <div className="mt-3 inline-flex h-8 items-center rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                  className="flex h-full w-8 items-center justify-center text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-950"
                  aria-label={`Decrease ${item.product.name} quantity`}
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="min-w-7 text-center text-xs font-semibold text-slate-900">{item.quantity}</span>
                <button
                  type="button"
                  onClick={() => updateQuantity(item.product.id, Math.min(item.product.stock, item.quantity + 1))}
                  className="flex h-full w-8 items-center justify-center text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={`Increase ${item.product.name} quantity`}
                  disabled={item.quantity >= item.product.stock}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Separator className="my-6 bg-slate-200" />

      <dl className="space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Subtotal</dt>
          <dd className="font-medium text-slate-900">₦{subtotal.toLocaleString('en-NG')}</dd>
        </div>
        {discount > 0 ? (
          <div className="flex justify-between gap-4 text-emerald-700">
            <dt>Discount</dt>
            <dd className="font-medium">−₦{discount.toLocaleString('en-NG')}</dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Delivery</dt>
          <dd className="font-medium text-slate-900">
            {shippingKnown ? `₦${shipping.toLocaleString('en-NG')}` : 'Calculated next'}
          </dd>
        </div>
      </dl>

      <Separator className="my-6 bg-slate-200" />

      <div className="flex items-baseline justify-between gap-4">
        <span className="text-lg font-bold text-slate-950">Total</span>
        <span className="text-2xl font-bold tracking-tight text-slate-950">₦{grandTotal.toLocaleString('en-NG')}</span>
      </div>

      <p className="mt-6 flex items-center justify-center gap-2 text-xs font-medium text-slate-500">
        <LockKeyhole className="h-4 w-4 text-slate-700" />
        Payments secured by Paystack
      </p>
    </aside>
  )
}
