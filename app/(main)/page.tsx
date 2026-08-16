import { and, asc, desc, eq, sql } from 'drizzle-orm'
import { Hero } from '@/components/ecommerce/hero'
import { RaffleStrip, type HomeRaffle } from '@/components/ecommerce/raffle-strip'
import { NewsletterForm } from '@/components/ecommerce/newsletter-form'
import { ProductShelf } from '@/components/ecommerce/product-shelf'
import { CategoryIconGrid, type CategoryIcon } from '@/components/ecommerce/category-icon-grid'
import { BrandLogos } from '@/components/ecommerce/brand-logos'
import { HotDealsCarousel } from '@/components/ecommerce/hot-deals-carousel'
import { db } from '@/lib/server/db'
import { categories, products, raffles } from '@/lib/server/schema'
import { getProducts } from '@/lib/server/product-helpers'
import type { Product } from '@/lib/services/product.service'

export const dynamic = 'force-dynamic'

function isStorefrontProduct(product: Product) {
  const name = product.name.trim().toLowerCase()
  return !name.startsWith('ux test product') && !name.startsWith('ux browser product')
}

async function getHomeData() {
  const activeProducts = eq(products.isActive, true)

  const [categoryRows, featuredRows, catalogRows, newestRows, raffleRows] = await Promise.all([
    db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        image: categories.image,
        parentId: categories.parentId,
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
    getProducts({ where: activeProducts, orderBy: desc(products.reviewCount), limit: 100 }),
    getProducts({ where: activeProducts, orderBy: desc(products.createdAt), limit: 12 }),
    db
      .select({
        id: raffles.id,
        title: raffles.title,
        image: raffles.image,
        prize: raffles.prize,
        ticketPrice: raffles.ticketPrice,
        maxTickets: raffles.maxTickets,
        soldTickets: raffles.soldTickets,
        status: raffles.status,
        drawDate: raffles.drawDate,
      })
      .from(raffles)
      .where(eq(raffles.status, 'active'))
      .orderBy(desc(raffles.createdAt))
      .limit(3),
  ])

  const catalog = catalogRows.filter(isStorefrontProduct)
  const featured = featuredRows.filter(isStorefrontProduct).slice(0, 4)
  const newest = newestRows.filter(isStorefrontProduct).slice(0, 4)

  const categoryIcons: CategoryIcon[] = categoryRows
    .filter(category => !category.parentId && category.productCount > 0)
    .slice(0, 8)
    .map(category => ({
      slug: category.slug,
      name: category.name,
      href: `/categories/${category.slug}`,
    }))

  const featuredProducts = featured.length > 0 ? featured : catalog.slice(0, 4)
  const latestProducts = newest.length > 0 ? newest : catalog.slice(4, 8)
  const hotDeals = catalog
    .filter(product => product.comparePrice && product.comparePrice > product.price)
    .slice(0, 10)

  const productsByCategory = new Map<string, Product[]>()
  for (const product of catalog) {
    const slug = product.category?.slug
    if (!slug) continue
    const categoryProducts = productsByCategory.get(slug) ?? []
    categoryProducts.push(product)
    productsByCategory.set(slug, categoryProducts)
  }

  const categoryShelves = [
    { slug: 'iphones-uk-used', title: 'iPhones UK Used' },
    { slug: 'android-phones-tablets', title: 'Android Phones & Tablets' },
    { slug: 'laptops-monitors', title: 'Laptops & Computing' },
    { slug: 'gaming-consoles', title: 'Gaming & Consoles' },
    { slug: 'speakers', title: 'Speakers & Audio' },
    { slug: 'smartwatches', title: 'Smartwatches & Wearables' },
    { slug: 'rechargeable-fans', title: 'Rechargeable Fans' },
    { slug: 'monitors', title: 'Monitors & Displays' },
  ]
    .map(shelf => ({
      ...shelf,
      href: `/categories/${shelf.slug}`,
      products: (productsByCategory.get(shelf.slug) ?? []).slice(0, 8),
    }))
    .filter(shelf => shelf.products.length > 0)

  const brandSet = new Set<string>()
  ;[...featured, ...catalog, ...newest].forEach(product => {
    if (product.brand) brandSet.add(product.brand)
  })

  const brands = Array.from(brandSet)
    .slice(0, 10)
    .map(name => ({ name, slug: name.toLowerCase().replace(/\s+/g, '-') }))

  const homeRaffles: HomeRaffle[] = raffleRows.map(row => ({
    id: row.id,
    title: row.title,
    image: row.image,
    prize: row.prize,
    ticketPrice: Number(row.ticketPrice),
    maxTickets: row.maxTickets,
    soldTickets: row.soldTickets,
    status: row.status,
    drawDate: row.drawDate instanceof Date ? row.drawDate.toISOString() : String(row.drawDate),
  }))

  return {
    categoryIcons,
    categoryShelves,
    brands,
    featured: featuredProducts,
    hotDeals,
    newest: latestProducts,
    raffles: homeRaffles,
  }
}

export default async function HomePage() {
  const { categoryIcons, categoryShelves, brands, featured, hotDeals, newest, raffles: activeRaffles } = await getHomeData()

  const shelfBackgrounds = ['bg-white', 'bg-[#EEF0EE]', 'bg-[#F5F0E6]']

  return (
    <div className="animate-page-reveal bg-background">
      <Hero />
      <CategoryIconGrid title="Shop what you need" categories={categoryIcons} />
      <ProductShelf title="Featured picks" href="/shop?sort=popular" products={featured} columns={4} className="bg-[#EEF0EE]" />
      <HotDealsCarousel products={hotDeals} />

      {categoryShelves.slice(0, 3).map((shelf, index) => (
        <ProductShelf
          key={shelf.slug}
          title={shelf.title}
          href={shelf.href}
          products={shelf.products}
          columns={4}
          className={shelfBackgrounds[index % shelfBackgrounds.length]}
        />
      ))}

      <RaffleStrip raffles={activeRaffles} />

      {categoryShelves.slice(3).map((shelf, index) => (
        <ProductShelf
          key={shelf.slug}
          title={shelf.title}
          href={shelf.href}
          products={shelf.products}
          columns={4}
          className={shelfBackgrounds[(index + 1) % shelfBackgrounds.length]}
        />
      ))}

      <ProductShelf title="Latest arrivals" href="/shop?sort=newest" products={newest} columns={4} className="bg-[#EEF0EE]" />
      <BrandLogos brands={brands} />

      <section className="bg-secondary py-14 text-secondary-foreground sm:py-16">
        <div className="mx-auto grid max-w-7xl items-center gap-7 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <h2 className="text-3xl font-bold">Good drops. No spam.</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-white/60">
              Be first to hear about new stock, honest price drops and live raffle draws.
            </p>
          </div>
          <NewsletterForm />
        </div>
      </section>
    </div>
  )
}
