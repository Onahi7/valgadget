import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { and, asc, desc, eq, sql, inArray } from 'drizzle-orm'
import { Button } from '@/components/ui/button'
import { ProductShelf } from '@/components/ecommerce/product-shelf'
import { CategoryIconGrid, type CategoryIcon } from '@/components/ecommerce/category-icon-grid'
import { BrandLogos } from '@/components/ecommerce/brand-logos'
import { db } from '@/lib/server/db'
import { categories, products, raffles } from '@/lib/server/schema'
import { getProducts } from '@/lib/server/product-helpers'
import type { Category } from '@/lib/services/category.service'

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

  // Extract unique brands from products
  const brandSet = new Set<string>()
  trending.forEach(p => { if (p.brand) brandSet.add(p.brand) })
  newest.forEach(p => { if (p.brand) brandSet.add(p.brand) })
  featured.forEach(p => { if (p.brand) brandSet.add(p.brand) })
  const brands = Array.from(brandSet)
    .slice(0, 12)
    .map(name => ({
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
    }))

  const priceDeals = trending
    .filter(product => typeof product.comparePrice === 'number' && product.comparePrice > product.price)
    .slice(0, 8)

  return {
    categoryIcons,
    brands,
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
  const { categoryIcons, brands, featured, priceDeals, trending, newest, topRated, sectionData, raffles: activeRaffles } =
    await getHomeData()

  return (
    <div className="animate-page-reveal bg-background">
      {/* ── SHOP BY CATEGORIES ────────────────────────────────────── */}
      <CategoryIconGrid categories={categoryIcons} />

      {/* ── OUR TOP BRANDS ────────────────────────────────────────── */}
      <BrandLogos brands={brands} />

      {/* ── CATEGORY SECTIONS (Tech Direct pattern) ──────────────── */}
      {sectionData.map(section => (
        <section key={section.slug} className="border-t border-border py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-5 flex items-end justify-between gap-4">
              <h2 className="text-2xl font-bold">{section.title}</h2>
              <Link
                href={section.viewAllHref}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                View All
                <ArrowRight className="ml-1 inline-block h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {section.products.slice(0, 6).map(product => (
                <div key={product.id} className="text-sm">
                  <Link href={`/products/${product.slug}`} className="block">
                    <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-white">
                      <Image
                        src={product.images[0] ?? '/placeholder-product.svg'}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                        className="object-contain p-3"
                        unoptimized
                      />
                    </div>
                  </Link>
                  <div className="mt-2">
                    {product.brand && (
                      <p className="text-[10px] text-muted-foreground">{product.brand}</p>
                    )}
                    <Link href={`/products/${product.slug}`}>
                      <h3 className="line-clamp-2 text-xs font-medium leading-snug">{product.name}</h3>
                    </Link>
                    <p className="mt-1 text-xs font-semibold">₦{product.price.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* ── NEW PRODUCTS ─────────────────────────────────────────── */}
      <ProductShelf title="New Products" href="/shop?sort=newest" products={newest} columns={4} />

      {/* ── FEATURED PRODUCTS ────────────────────────────────────── */}
      <ProductShelf title="Featured Products" href="/shop?sort=popular" products={featured} columns={4} />

      {/* ── CURRENT TOP SELLERS ──────────────────────────────────── */}
      <ProductShelf title="Current Top Sellers" href="/shop?sort=popular" products={trending} columns={4} />

      {/* ── SUBCATEGORY BANNER CARDS (Tech Direct pattern) ───────── */}
      <section className="border-t border-border py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: 'Speakers', slug: 'speakers', image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=80' },
              { label: 'Rechargeable Fans', slug: 'rechargeable-fans', image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=800&q=80' },
              { label: 'Monitors', slug: 'monitors', image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80' },
            ].map(card => (
              <Link
                key={card.slug}
                href={`/categories/${card.slug}`}
                className="group relative overflow-hidden rounded-lg bg-muted"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <Image
                    src={card.image}
                    alt={card.label}
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    unoptimized
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 p-4">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-white">{card.label}</h3>
                  <span className="mt-1 inline-flex items-center text-xs font-medium text-white/80 group-hover:text-white">
                    Shop Now
                    <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-4 text-right">
            <Link
              href="/categories"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              View All Categories
              <ArrowRight className="ml-1 inline-block h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── TOP RATED ────────────────────────────────────────────── */}
      <ProductShelf title="Top Rated Products" href="/shop?sort=rating" products={topRated} columns={4} />

      {/* ── RECOMMENDED FOR YOU ──────────────────────────────────── */}
      <ProductShelf title="Recommended For You" href="/shop" products={priceDeals.length ? priceDeals : trending.slice(0, 8)} columns={4} />

      {/* ── NEWSLETTER CTA (Tech Direct pattern) ─────────────────── */}
      <section className="border-t border-border py-12 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold">Discover What's New</h2>
          <p className="mt-2 text-sm text-muted-foreground">Subscribe to our newsletter for the latest deals and updates</p>
          <div className="mt-6 flex max-w-md mx-auto gap-2">
            <input
              type="email"
              placeholder="Your email address"
              className="flex-1 rounded-md border border-border bg-card px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button>Subscribe</Button>
          </div>
        </div>
      </section>

      {/* ── LIVE RAFFLES (keep our unique feature) ────────────────── */}
      {activeRaffles.length > 0 ? (
        <section className="border-t border-border py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-5 flex items-end justify-between gap-4">
              <h2 className="text-2xl font-bold">Live Raffles</h2>
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
