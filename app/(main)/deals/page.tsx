import Link from 'next/link'
import { and, desc, eq, sql } from 'drizzle-orm'
import { Flame } from 'lucide-react'
import type { Metadata } from 'next'
import { db } from '@/lib/server/db'
import { products, categories } from '@/lib/server/schema'
import { normalizeProduct } from '@/lib/server/product-helpers'
import { ProductGrid } from '@/components/ecommerce/product-grid'
import { EmptyState } from '@/components/ecommerce/empty-state'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Hot Deals & Price Drops',
  description: 'Gadgets currently discounted at Val Gadgets. Phones, laptops, powerbanks and more at reduced prices — sorted by the biggest savings.',
}

async function getDeals() {
  const rows = await db
    .select({
      id: products.id, name: products.name, slug: products.slug,
      description: products.description, shortDescription: products.shortDescription,
      specs: products.specs,
      price: products.price, comparePrice: products.comparePrice,
      images: products.images, categoryId: products.categoryId,
      stock: products.stock, sku: products.sku, rating: products.rating,
      reviewCount: products.reviewCount, tags: products.tags,
      featured: products.featured, isNew: products.isNew, isActive: products.isActive,
      brand: products.brand, createdAt: products.createdAt, updatedAt: products.updatedAt,
      category: { id: categories.id, name: categories.name, slug: categories.slug },
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(
      and(
        eq(products.isActive, true),
        sql`products.compare_price IS NOT NULL AND products.compare_price::numeric > products.price::numeric`
      )
    )
    .orderBy(desc(products.comparePrice))
    .limit(60)

  // Biggest percentage drop first.
  return rows
    .map(r => normalizeProduct(r as Record<string, unknown>))
    .filter(p => p.comparePrice && p.comparePrice > p.price)
    .map(p => ({ product: p, discount: Math.round(((p.comparePrice! - p.price) / p.comparePrice!) * 100) }))
    .sort((a, b) => b.discount - a.discount)
    .map(d => d.product)
}

export default async function DealsPage() {
  const deals = await getDeals()

  return (
    <div className="animate-page-reveal bg-background">
      {/* Page hero band */}
      <section className="bg-secondary text-secondary-foreground">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <p className="mb-2 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-primary">
            <Flame className="h-3.5 w-3.5" />
            Price drops
          </p>
          <h1 className="text-3xl font-bold sm:text-4xl">Hot Deals</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-secondary-foreground/70">
            Every product on this page is currently below its usual price.
            Sorted by the biggest discounts first — when stock clears, it clears.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {deals.length === 0 ? (
          <EmptyState
            icon={Flame}
            title="No active deals right now"
            description="New price drops land regularly. Check back soon or grab something from the full catalogue."
            action={{ label: 'Browse all products', href: '/shop' }}
          />
        ) : (
          <>
            <div className="mb-6 flex items-baseline justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{deals.length}</span> products discounted
              </p>
              <Link href="/shop" className="text-sm font-medium text-primary hover:underline">
                View full shop
              </Link>
            </div>
            <ProductGrid products={deals} />
          </>
        )}
      </div>
    </div>
  )
}