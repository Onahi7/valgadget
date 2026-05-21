import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  BatteryCharging,
  Headphones,
  ImageIcon,
  Monitor,
  Search,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Speaker,
  Truck,
  Watch,
} from 'lucide-react'
import { and, asc, desc, eq, sql } from 'drizzle-orm'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProductCard } from '@/components/ecommerce/product-card'
import { db } from '@/lib/server/db'
import { categories, products, raffles } from '@/lib/server/schema'
import { cn } from '@/lib/utils'
import type { Category } from '@/lib/services/category.service'
import type { Product } from '@/lib/services/product.service'

export const dynamic = 'force-dynamic'

type CategoryTileConfig = {
  slug: string
  title: string
  label: string
  description: string
  icon: typeof Smartphone
  color: string
}

type CategoryWithCount = Category & { productCount: number }

type CategoryTile = CategoryTileConfig & {
  category: CategoryWithCount
  image?: string
}

type HomeRaffle = {
  id: string
  title: string
  image?: string | null
  ticketPrice: number
}

const CATEGORY_TILES: CategoryTileConfig[] = [
  {
    slug: 'iphones-uk-used',
    title: 'UK Used iPhones',
    label: 'Phones',
    description: 'Clean iPhone options with popular storage choices.',
    icon: Smartphone,
    color: 'bg-blue-600',
  },
  {
    slug: 'android-phones-tablets',
    title: 'Android Phones & Tablets',
    label: 'Android',
    description: 'Redmi, Xiaomi and tablets for work and daily use.',
    icon: Smartphone,
    color: 'bg-emerald-600',
  },
  {
    slug: 'speakers',
    title: 'Speakers',
    label: 'Audio',
    description: 'Portable speakers from everyday to party-ready sizes.',
    icon: Speaker,
    color: 'bg-orange-600',
  },
  {
    slug: 'monitors',
    title: 'Monitors',
    label: 'Displays',
    description: 'Slim monitors for home, office and gaming setups.',
    icon: Monitor,
    color: 'bg-violet-600',
  },
  {
    slug: 'smartwatches',
    title: 'Smartwatches',
    label: 'Wearables',
    description: 'Apple Watch and smartwatch options for daily tracking.',
    icon: Watch,
    color: 'bg-rose-600',
  },
  {
    slug: 'rechargeable-fans',
    title: 'Rechargeable Fans',
    label: 'Power',
    description: 'Rechargeable fans for home and office comfort.',
    icon: BatteryCharging,
    color: 'bg-cyan-600',
  },
]

const SERVICE_POINTS = [
  { icon: Truck, title: 'Nationwide Delivery', text: 'Dispatch and delivery across Nigeria.' },
  { icon: ShieldCheck, title: 'Secure Checkout', text: 'Protected payment and order flow.' },
  { icon: Search, title: 'Easy Product Search', text: 'Find items by category, model or price.' },
  { icon: Headphones, title: 'Responsive Support', text: 'Get help choosing the right product.' },
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
  createdAt: products.createdAt,
  updatedAt: products.updatedAt,
  category: { id: categories.id, name: categories.name, slug: categories.slug },
}

function isDisplayableImage(src?: string | null) {
  return Boolean(src && !src.includes('source.unsplash.com'))
}

function displayImages(images?: string[] | null) {
  return (images ?? []).filter(isDisplayableImage)
}

function ImagePending({ dark = false }: { dark?: boolean }) {
  return (
    <div className={cn(
      'absolute inset-0 flex flex-col items-center justify-center gap-2',
      dark ? 'bg-black/35 text-white/75' : 'bg-muted text-muted-foreground',
    )}>
      <ImageIcon className="h-8 w-8 opacity-60" />
      <span className="text-xs font-medium">Image pending</span>
    </div>
  )
}

function normalizeProduct(row: typeof productSelection extends infer T ? any : never): Product {
  return {
    ...row,
    price: Number(row.price),
    comparePrice: row.comparePrice ? Number(row.comparePrice) : undefined,
    rating: row.rating ? Number(row.rating) : 0,
    categoryId: row.categoryId ?? '',
    tags: row.tags ?? [],
    images: displayImages(row.images),
    specs: row.specs ?? [],
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
    getProducts({ where: and(activeProducts, eq(products.featured, true)), orderBy: desc(products.createdAt), limit: 8 }),
    getProducts({ where: activeProducts, orderBy: desc(products.reviewCount), limit: 16 }),
    getProducts({ where: activeProducts, orderBy: desc(products.createdAt), limit: 8 }),
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

  const allForImages = [...featured, ...trending, ...newest, ...topRated]
  const productByCategory = new Map<string, Product[]>()

  for (const product of allForImages) {
    const group = productByCategory.get(product.categoryId) ?? []
    group.push(product)
    productByCategory.set(product.categoryId, group)
  }

  const normalizedCategories: CategoryWithCount[] = categoryRows.map(category => ({
    ...category,
    description: category.description ?? undefined,
    image: category.image ?? undefined,
    icon: category.icon ?? undefined,
    parentId: category.parentId ?? undefined,
    sortOrder: category.sortOrder ?? undefined,
    productCount: Number(category.productCount ?? 0),
    createdAt: category.createdAt instanceof Date ? category.createdAt.toISOString() : String(category.createdAt),
    updatedAt: category.updatedAt instanceof Date ? category.updatedAt.toISOString() : String(category.updatedAt),
  }))

  const tileConfigBySlug = new Map(CATEGORY_TILES.map(config => [config.slug, config]))
  const categoryTiles = normalizedCategories
    .filter(category => !category.parentId)
    .slice(0, 8)
    .map((category, index) => {
      const config = tileConfigBySlug.get(category.slug) ?? {
        slug: category.slug,
        title: category.name,
        label: 'Category',
        description: category.description || 'Browse available products in this department.',
        icon: ShoppingBag,
        color: ['bg-blue-600', 'bg-emerald-600', 'bg-orange-600', 'bg-violet-600', 'bg-rose-600', 'bg-cyan-600', 'bg-slate-700', 'bg-teal-600'][index % 8],
      }
      const categoryProductImage = productByCategory.get(category.id)?.find(product => isDisplayableImage(product.images[0]))?.images[0]
      const image = categoryProductImage || (isDisplayableImage(category.image) ? category.image : undefined)
      return { ...config, category, image }
    })

  const priceDeals = trending
    .filter(product => typeof product.comparePrice === 'number' && product.comparePrice > product.price)
    .slice(0, 8)

  return {
    categoryTiles,
    featured: featured.length ? featured : trending.slice(0, 8),
    priceDeals: priceDeals.length ? priceDeals : trending.slice(0, 8),
    trending: trending.slice(0, 8),
    newest,
    topRated,
    raffles: raffleRows.map(row => ({
      id: row.id,
      title: row.title,
      image: row.image,
      ticketPrice: Number(row.ticketPrice),
    })) satisfies HomeRaffle[],
  }
}

function ProductShelf({
  eyebrow,
  title,
  href,
  products,
}: {
  eyebrow?: string
  title: string
  href: string
  products: Product[]
}) {
  if (products.length === 0) return null

  return (
    <section className="border-t border-border bg-background py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-start justify-between gap-4 sm:items-end">
          <div>
            {eyebrow ? <p className="mb-1 text-xs font-mono uppercase tracking-widest text-primary">{eyebrow}</p> : null}
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          </div>
          <Button variant="outline" size="sm" asChild className="rounded-full">
            <Link href={href}>
              View all <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default async function HomePage() {
  const { categoryTiles, featured, priceDeals, trending, newest, topRated, raffles: activeRaffles } = await getHomeData()
  const heroProduct = featured[0] ?? trending[0]
  const sideProducts = (featured.length > 1 ? featured.slice(1, 3) : trending.slice(1, 3))

  return (
    <div className="animate-page-reveal bg-background">
      <section className="border-b border-border bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="relative overflow-hidden rounded-lg border border-border bg-card p-5 sm:p-8 lg:min-h-[360px]">
              <div className="relative z-10 max-w-xl">
                <Badge className="mb-4 border-primary/20 bg-primary/10 text-primary">Browse, Pay, Relax</Badge>
                <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
                  Thousands of electronics, phones, laptops and gadgets
                </h1>
                <p className="mt-4 max-w-lg text-base leading-7 text-muted-foreground">
                  Shop phones, speakers, monitors, rechargeable fans, smartwatches and daily electronics from one clean storefront.
                </p>
                <div className="mt-6 flex flex-col gap-3 min-[420px]:flex-row">
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
              {heroProduct?.images?.[0] ? (
                <div className="absolute bottom-0 right-0 hidden h-full w-1/2 lg:block">
                  <Image src={heroProduct.images[0]} alt={heroProduct.name} fill className="object-contain object-bottom p-6" unoptimized />
                </div>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {sideProducts.map(product => (
                <Link key={product.id} href={`/products/${product.slug}`} className="relative min-h-[170px] overflow-hidden rounded-lg border border-border bg-card p-5">
                  <div className="relative z-10 max-w-[60%]">
                    <p className="text-xs font-mono uppercase tracking-widest text-primary">Featured</p>
                    <h2 className="mt-1 line-clamp-2 text-lg font-bold">{product.name}</h2>
                    <p className="mt-2 text-sm font-semibold">NGN {product.price.toLocaleString()}</p>
                  </div>
                  {product.images[0] ? <Image src={product.images[0]} alt={product.name} fill className="object-contain object-right-bottom p-4" unoptimized /> : <ImagePending />}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border py-6">
        <div className="mx-auto grid max-w-7xl gap-3 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {SERVICE_POINTS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-muted-foreground">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-5 flex items-start justify-between gap-4 sm:items-end">
            <div>
              <p className="mb-1 text-xs font-mono uppercase tracking-widest text-primary">Shop by department</p>
              <h2 className="text-2xl font-bold tracking-tight">Browse Categories</h2>
            </div>
            <Button variant="outline" size="sm" asChild className="rounded-full">
              <Link href="/categories">
                All categories <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
          {categoryTiles.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
              <p className="font-semibold">No active categories yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Add or activate categories from the admin catalog.</p>
            </div>
          ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categoryTiles.map((tile, index) => (
              <Link
                key={tile.category.id}
                href={`/shop?category=${tile.category.slug}`}
                className={cn('group relative min-h-[220px] overflow-hidden rounded-lg border border-border bg-card', index === 0 && 'lg:col-span-2')}
              >
                {tile.image ? <Image src={tile.image} alt={tile.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" unoptimized /> : <ImagePending dark />}
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/10" />
                <div className="relative flex h-full flex-col justify-end p-5 text-white">
                  <span className={cn('mb-4 flex h-11 w-11 items-center justify-center rounded-md text-white', tile.color)}>
                    <tile.icon className="h-5 w-5" />
                  </span>
                  <p className="text-xs font-mono uppercase tracking-widest text-white/70">{tile.label}</p>
                  <h3 className="mt-1 text-xl font-bold">{tile.title}</h3>
                  <p className="mt-2 max-w-sm text-sm text-white/75">{tile.description}</p>
                  <p className="mt-3 text-xs text-white/70">{tile.category.productCount} products</p>
                </div>
              </Link>
            ))}
          </div>
          )}
        </div>
      </section>

      <ProductShelf eyebrow="Price deals" title="Price Deals" href="/shop?sort=popular" products={priceDeals} />
      <ProductShelf eyebrow="Popular now" title="Trending Products" href="/shop?sort=popular" products={trending} />
      <ProductShelf eyebrow="Fresh arrivals" title="New Products" href="/shop?sort=newest" products={newest} />
      <ProductShelf eyebrow="Customer signals" title="Top Rated Products" href="/shop?sort=rating" products={topRated} />

      {activeRaffles.length > 0 ? (
        <section className="border-t border-border bg-muted/20 py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-5 flex items-start justify-between gap-4 sm:items-end">
              <div>
                <p className="mb-1 text-xs font-mono uppercase tracking-widest text-primary">Extra offers</p>
                <h2 className="text-2xl font-bold tracking-tight">Live Raffles</h2>
              </div>
              <Button variant="outline" size="sm" asChild className="rounded-full">
                <Link href="/raffles">
                  View raffles <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {activeRaffles.map(raffle => (
                <Link key={raffle.id} href={`/raffles/${raffle.id}`} className="overflow-hidden rounded-lg border border-border bg-card">
                  <div className="relative h-44">
                    {raffle.image ? <Image src={raffle.image} alt={raffle.title} fill className="object-cover" unoptimized /> : null}
                  </div>
                  <div className="p-4">
                    <Badge className="mb-2 border-primary/20 bg-primary/10 text-primary">Live</Badge>
                    <h3 className="line-clamp-1 font-semibold">{raffle.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Ticket: NGN {raffle.ticketPrice.toLocaleString()}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="border-t border-border py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 rounded-lg border border-border bg-card p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-primary">Shop with ease</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight">Browse the full catalog and checkout in a few steps.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Browse departments, compare products, add to cart and complete your order from one simple storefront.
              </p>
            </div>
            <Button asChild size="lg" className="rounded-full px-8">
              <Link href="/shop">
                Continue Shopping <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
