'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Plus, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/contexts/cart-context'
import { useCartDrawer } from '@/contexts/cart-drawer-context'
import { formatPrice } from '@/lib/utils'
import { toast } from 'sonner'
import type { Product } from '@/lib/services/product.service'

interface FrequentlyBoughtTogetherProps {
  main: Product
  related: Product[]
}

/**
 * Industry-standard "Frequently bought together" cross-sell module.
 * Shows the main product + 1-2 related products with a combined "Add all to cart" button.
 */
export function FrequentlyBoughtTogether({ main, related }: FrequentlyBoughtTogetherProps) {
  const { addToCart } = useCart()
  const { openCart } = useCartDrawer()

  if (related.length === 0) return null

  const bundle = [main, ...related.slice(0, 2)]
  const bundleTotal = bundle.reduce((sum, p) => sum + p.price, 0)

  const addBundle = () => {
    bundle.forEach(p => {
      if (p.stock > 0) {
        addToCart({
          id: p.id, name: p.name, slug: p.slug,
          images: p.images, price: p.price, sku: p.sku, stock: p.stock,
        })
      }
    })
    toast.success('Bundle added to cart', { description: `${bundle.length} items` })
    setTimeout(() => openCart(), 300)
  }

  return (
    <section className="border-t border-border bg-card py-10 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-6 text-2xl font-bold">Frequently Bought Together</h2>
        <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            {bundle.map((product, idx) => (
              <div key={product.id} className="flex items-center gap-3 sm:gap-4">
                <Link
                  href={`/products/${product.slug}`}
                  className="group flex w-32 flex-col sm:w-40"
                >
                  <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-white">
                    <Image
                      src={product.images[0] ?? '/placeholder-product.svg'}
                      alt={product.name}
                      fill
                      sizes="160px"
                      className="object-contain p-2 transition-transform group-hover:scale-105"
                      unoptimized
                    />
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs font-medium leading-snug group-hover:text-primary">
                    {product.name}
                  </p>
                  <p className="mt-1 text-sm font-semibold">{formatPrice(product.price)}</p>
                </Link>
                {idx < bundle.length - 1 ? (
                  <Plus className="h-5 w-5 shrink-0 text-muted-foreground" />
                ) : null}
              </div>
            ))}
          </div>
          <div className="flex flex-col items-start justify-center gap-3 lg:items-end lg:text-right">
            <div>
              <p className="text-sm text-muted-foreground">Bundle total</p>
              <p className="text-2xl font-bold">{formatPrice(bundleTotal)}</p>
            </div>
            <Button size="lg" onClick={addBundle} className="w-full lg:w-auto">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add bundle to cart
            </Button>
            <p className="text-xs text-muted-foreground">Save when you buy together</p>
          </div>
        </div>
      </div>
    </section>
  )
}
