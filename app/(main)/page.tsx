import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { and, asc, desc, eq, sql, inArray } from 'drizzle-orm'
import { Button } from '@/components/ui/button'
import { ProductShelf } from '@/components/ecommerce/product-shelf'
import { SectionCover } from '@/components/ecommerce/section-cover'
import { CategoryIconGrid, type CategoryIcon } from '@/components/ecommerce/category-icon-grid'
import { TrustBar } from '@/components/layout/trust-bar'
import { db } from '@/lib/server/db'
import { categories, products, raffles } from '@/lib/server/schema'
import type { Category } from '@/lib/services/category.service'
import type { Product } from '@/lib/services/product.service'

export const dynamic = 'force-dynamic'

type CategoryWithCount = Category & { productCount: number }

/**
 * Featured section covers on the homepage. Each one picks 6 products from
 * the named category and shows 3 subcategories below.
 */
const SECTION_COVERS: {
  slug: string
  title: string
  viewAllHref: string
  coverImage: string
  subcategories: { label: string; slug: string }[]
}[] = [
  {
    slug: 'speakers',
    title: 'Speakers & Sound',
    viewAllHref: '/categories/speakers',
    coverImage: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=1600&q=80',
    subcategories: [
      { label: 'Speakers', slug: 'speakers' },
      { label: 'Headphones', slug: 'headphones' },
      { label: 'Earbuds', slug: 'earbuds' },
    ],
  },
  {
    slug: 'iphones-uk-used',
    title: 'iPhones & Premium Smartphones',
    viewAllHref: '/categories/iphones-uk-used',
    coverImage: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1600&q=80',
    subcategories: [
      { label: 'UK Used iPhones', slug: 'iphones-uk-used' },
      { label: 'Android Phones & Tablets', slug: 'android-phones-tablets' },
      { label: 'Smartwatches', slug: 'smartwatches' },
    ],
  },
  {
    slug: 'rechargeable-fans',
    title: 'Rechargeable Fans & Home Comfort',
    viewAllHref: '/categories/rechargeable-fans',
    coverImage: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=1600&q=80',
    subcategories: [
      { label: 'Rechargeable Fans', slug: 'rechargeable-fans' },
      { label: 'Home Appliances', slug: 'home-appliances-comfort' },
      { label: 'Powerbanks', slug: 'powerbanks' },
    ],
  },
  {
    slug: 'monitors',
    title: 'Monitors & Computing',
    viewAllHref: '/categories/monitors',
    coverImage: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1600&q=80',
    subcategories: [
      { label: 'Monitors', slug: 'monitors' },
      { label: 'Laptops & Monitors', slug: 'laptops-monitors' },
      { label: 'Computer Peripherals', slug: 'computer-peripherals' },
    ],
  },
]

const productSelection = {
  id: products.id,
  name: products.name,
  slug: products.slug,
  description: products.description,
  shortDescription: products.shortDescription,
  specs: products.specs,
  price: products.price,
  comparePrice: products.comparePrice,
  images: products.images,
  categoryId: products.categoryId,
  stock: products.stock,
  sku: products.sku,
  rating: products.rating,
  reviewCount: products.reviewCount,
  tags: products.tags,
  featured: products.featured,
  isNew: products.isNew,
  isActive: products.isActive,
  brand: products.brand,
  createdAt: products.createdAt,
  updatedAt: products.updatedAt,
  category: { id: categories.id, name: categories.name, slug: categories.slug },
}

function isDisplayableImage(src?: string | null) {
  if (!src) return false
  return !src.includes('source.unsplash.com')
}

function displayImages(images?: string[] | null) {
  const usable = (images ?? []).filter(isDisplayableImage)
  return usable.length ? usable : ['/placeholder-product.svg']
}

function normalizeProduct(row: any): Product {
  return {
    ...row,
    price: Number(row.price),
    comparePrice: row.comparePrice ? Number(row.comparePrice) : undefined,
    rating: row.rating ? Number(row.rating) : 0,
    categoryId: row.categoryId ?? '',
    tags: row.tags ?? [],
    images: displayImages(row.images),
    specs: row.specs ?? [],
    brand: row.brand ?? undefined,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
  }
}

async function getProducts({
  where,
  orderBy,
  limit = 8,
}: {
  where?: ReturnType<typeof and>
  orderBy: ReturnType<typeof desc> | ReturnType<typeof asc>
  limit?: number
}) {
  const rows = await db
    .select(productSelection)
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(where ?? eq(products.isActive, true))
    .orderBy(orderBy)
    .limit(limit)

  return rows.map(normalizeProduct)
}

async function getHomeData() {
  const activeProducts = eq(products.isActive, true)

  const [categoryRows, featured, trending, newest, topRated, raffleRows] = await Promise.all([
    db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        image: categories.image,
        coverImage: categories.coverImage,
        icon: categories.icon,
        parentId: categories.parentId,
        isActive: categories.isActive,
        sortOrder: categories.sortOrder,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
        productCount: sql<number>`(
          SELECT count(*)::int
          FROM products p
          WHERE p.is_active = true
            AND (
              p.category_id = categories.id
              OR p.category_id IN (SELECT c2.id FROM categories c2 WHERE c2.parent_id = categories.id)
            )
        )`,
      })
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(asc(categories.sortOrder)),
    getProducts({ where: and(activeProducts, eq(products.featured, true)), orderBy: desc(products.createdAt), limit: 4 }),
    getProducts({ where: activeProducts, orderBy: desc(products.reviewCount), limit: 8 }),
    getProducts({ where: activeProducts, orderBy: desc(products.createdAt), limit: 4 }),
    getProducts({ where: activeProducts, orderBy: desc(products.rating), limit: 8 }),
    db
      .select({
        id: raffles.id,
        title: raffles.title,
        image: raffles.image,
        ticketPrice: raffles.ticketPrice,
      })
      .from(raffles)
      .where(eq(raffles.status, 'active'))
      .orderBy(desc(raffles.createdAt))
      .limit(3),
  ])

  // Resolve section cover products by category slug (including children)
  const sectionData = await Promise.all(
    SECTION_COVERS.map(async cover => {
      // Look up the category + its children
      const [parent] = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.slug, cover.slug))
        .limit(1)

      let categoryIds: string[] = []
      if (parent) {
        const children = await db
          .select({ id: categories.id })
          .from(categories)
          .where(eq(categories.parentId, parent.id))
        categoryIds = [parent.id, ...children.map(c => c.id)]
      }

      const prods = categoryIds.length
        ? await getProducts({
            where: inArray(products.categoryId, categoryIds),
            orderBy: desc(products.createdAt),
            limit: 6,
          })
        : []

      const subImages = await Promise.all(
        cover.subcategories.map(async sub => {
          const [cat] = await db
            .select({ id: categories.id, image: categories.image, coverImage: categories.coverImage })
            .from(categories)
            .where(eq(categories.slug, sub.slug))
            .limit(1)
          return { label: sub.label, slug: sub.slug, image: cat?.coverImage ?? cat?.image }
        })
      )
      return { ...cover, products: prods, subcategories: subImages }
    })
  )

  // Category icon grid: pick top-level categories with images
  const categoryIcons: CategoryIcon[] = categoryRows
    .filter(c => !c.parentId && c.image && c.productCount > 0)
    .slice(0, 12)
    .map(c => ({
      slug: c.slug,
      name: c.name,
      image: c.image!,
      href: `/categories/${c.slug}`,
    }))

  const priceDeals = trending
    .filter(product => typeof product.comparePrice === 'number' && product.comparePrice > product.price)
    .slice(0, 8)

  return {
    categoryIcons,
    featured: featured.length ? featured : trending.slice(0, 4),
    priceDeals: priceDeals.length ? priceDeals : trending.slice(0, 8),
    trending: trending.slice(0, 8),
    newest,
    topRated,
    sectionData: sectionData.filter(s => s.products.length > 0),
    raffles: raffleRows.map(row => ({
      id: row.id,
      title: row.title,
      image: row.image,
      ticketPrice: Number(row.ticketPrice),
    })),
  }
}

export default async function HomePage() {
  const { categoryIcons, featured, priceDeals, trending, newest, topRated, sectionData, raffles: activeRaffles } =
    await getHomeData()

  return (
    <div className="animate-page-reveal bg-background">
      {/* ── BEAT 1: HERO (HEAVY) ────────────────────────────────────── */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-primary/10 via-primary/5 to-background p-6 sm:p-10">
              <p className="mb-3 text-xs font-mono uppercase tracking-widest text-primary">Browse, Pay, Relax</p>
              <h1 className="max-w-xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Premium electronics, phones, laptops and gadgets
              </h1>
              <p className="mt-3 max-w-lg text-base leading-7 text-muted-foreground sm:mt-4">
                Phones, speakers, monitors, rechargeable fans and smartwatches from one clean storefront.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" asChild className="rounded-full px-8">
                  <Link href="/shop">
                    Start Shopping <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="rounded-full px-8">
                  <Link href="/categories">View Categories</Link>
                </Button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {featured.slice(0, 2).map(product => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="relative min-h-[160px] overflow-hidden rounded-lg border border-border bg-card p-5"
                >
                  <div className="relative z-10 max-w-[60%]">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Featured</p>
                    <h2 className="mt-1 line-clamp-2 text-base font-bold">{product.name}</h2>
                    <p className="mt-2 text-sm font-semibold">₦{product.price.toLocaleString()}</p>
                  </div>
                  {product.images[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      sizes="(max-width: 1024px) 50vw, 32vw"
                      className="object-contain object-right-bottom p-4"
                      unoptimized
                    />
                  ) : null}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── BEAT 2: SHOP BY CATEGORIES (MEDIUM) ────────────────────── */}
      <CategoryIconGrid categories={categoryIcons} />

      {/* ── BEAT 3: TRENDING PRODUCTS (MEDIUM-HEAVY) ───────────────── */}
      <ProductShelf title="Trending Products" href="/shop?sort=popular" products={trending} columns={4} />

      {/* ── BEAT 4: TRUST BAR (LIGHT — REST BEAT) ─────────────────── */}
      <TrustBar />

      {/* ── BEAT 5: NEW PRODUCTS (MEDIUM) ─────────────────────────── */}
      <ProductShelf title="New Products" href="/shop?sort=newest" products={newest} columns={4} />

      {/* ── BEATS 6–9: SECTION COVERS (HEAVY) ──────────────────────── */}
      {sectionData.map(section => (
        <SectionCover
          key={section.slug}
          title={section.title}
          coverImage={section.coverImage}
          viewAllHref={section.viewAllHref}
          products={section.products}
          subcategories={section.subcategories.map(sub => ({
            label: sub.label,
            href: `/categories/${sub.slug}`,
            image: sub.image ?? undefined,
          }))}
        />
      ))}

      {/* ── BEAT 10: TOP RATED (MEDIUM) ───────────────────────────── */}
      <ProductShelf title="Top Rated Products" href="/shop?sort=rating" products={topRated} columns={4} />

      {/* ── BEAT 11: LIVE RAFFLES (MEDIUM) ─────────────────────────── */}
      {activeRaffles.length > 0 ? (
        <section className="border-t border-border py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-5 flex items-end justify-between gap-4">
              <h2 className="text-2xl font-bold tracking-tight">Live Raffles</h2>
              <Link
                href="/raffles"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                View all
                <ArrowRight className="ml-1 inline-block h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {activeRaffles.map(raffle => (
                <Link key={raffle.id} href={`/raffles/${raffle.id}`} className="group overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md">
                  <div className="relative h-44 bg-muted">
                    {raffle.image ? (
                      <Image src={raffle.image} alt={raffle.title} fill className="object-cover" unoptimized />
                    ) : null}
                  </div>
                  <div className="p-4">
                    <p className="mb-2 text-[10px] font-mono uppercase tracking-widest text-primary">Live</p>
                    <h3 className="line-clamp-1 font-semibold group-hover:text-primary">{raffle.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Ticket: ₦{raffle.ticketPrice.toLocaleString()}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}
