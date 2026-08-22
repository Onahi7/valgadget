'use client'

import Link from 'next/link'
import { ArrowRight, Flame } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { ProductCard } from '@/components/ecommerce/product-card'
import type { Product } from '@/lib/services/product.service'

type Props = {
  products: Product[]
}

/**
 * Today's price drops — high-contrast charcoal band with an orange accent.
 * Only shows products that carry a comparePrice above the live price.
 */
export function HotDealsCarousel({ products }: Props) {
  if (products.length === 0) return null

  return (
    <section className="bg-secondary py-10 text-secondary-foreground sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="mb-1.5 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-tangerine">
              <Flame className="h-3.5 w-3.5" />
              Price drops
            </p>
            <h2 className="text-2xl font-bold sm:text-3xl">Today&apos;s Hot Deals</h2>
          </div>
          <Button variant="outline" size="sm" className="shrink-0 rounded-full border-secondary-foreground/25 text-secondary-foreground hover:bg-secondary-foreground/10 hover:text-secondary-foreground" asChild>
            <Link href="/deals">
              All deals <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        <Carousel
          opts={{ align: 'start', containScroll: 'trimSnaps' }}
          className="relative"
        >
          <CarouselContent className="-ml-3 sm:-ml-4">
            {products.map(product => (
              <CarouselItem key={product.id} className="basis-[72%] pl-3 min-[480px]:basis-1/2 sm:basis-1/3 sm:pl-4 lg:basis-1/4 xl:basis-1/5">
                <ProductCard product={product} className="h-full" />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-2 hidden bg-background text-foreground shadow-md lg:flex" />
          <CarouselNext className="right-2 hidden bg-background text-foreground shadow-md lg:flex" />
        </Carousel>
      </div>
    </section>
  )
}
