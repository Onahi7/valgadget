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
import { withCategoryDisplayImages } from '@/lib/server/category-images'
import { FALLBACK_CATEGORIES, FALLBACK_PRODUCTS } from '@/lib/storefront-fallback'
import { withDescendantProductCounts } from '@/lib/category-hierarchy'

export const dynamic = 'force-dynamic'

function isStorefrontProduct(product: Product) {
  const name = product.name.trim().toLowerCase()
  return !name.startsWith('ux test product') && !name.startsWith('ux browser product')
}

async function getHomeData() {
  const activeProducts = eq(products.isActive, true)

  const [categoryResult, featuredResult, catalogResult, newestResult, raffleResult] = await Promise.allSettled([
    db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        image: categories.image,
        parentId: categories.parentId,
        productCount: sql<number>`(select count(*)::int from products p where p.is_active = true and p.category_id = categories.id)`,
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

  const categoryRows = withDescendantProductCounts(categoryResult.status === 'fulfilled' ? categoryResult.value : FALLBACK_CATEGORIES)
  const featuredRows = featuredResult.status === 'fulfilled' ? featuredResult.value : FALLBACK_PRODUCTS
  const catalogRows = catalogResult.status === 'fulfilled' ? catalogResult.value : FALLBACK_PRODUCTS
  const newestRows = newestResult.status === 'fulfilled' ? newestResult.value : FALLBACK_PRODUCTS
  const raffleRows = raffleResult.status === 'fulfilled' ? raffleResult.value : []

  const catalog = catalogRows.filter(isStorefrontProduct)
  const featured = featuredRows.filter(isStorefrontProduct).slice(0, 6)
  const newest = newestRows.filter(isStorefrontProduct).slice(0, 6)

  const displayCategories = await withCategoryDisplayImages(categoryRows).catch(() => categoryRows.map(category => ({
    ...category,
    displayImage: category.image ?? null,
    imageStatus: category.image ? 'ready' as const : 'needs_image' as const,
  })))
  const categoryIcons: CategoryIcon[] = displayCategories
    .filter(category => !category.parentId)
    .map(category => ({
      slug: category.slug,
      name: category.name,
      href: `/categories/${category.slug}`,
      available: category.productCount > 0,
      image: category.displayImage,
    }))

  const featuredProducts = featured.length > 0 ? featured : catalog.slice(0, 6)
  const latestProducts = newest.length > 0 ? newest : catalog.slice(6, 12)
  const hotDeals = catalog
    .filter(product => product.comparePrice && product.comparePrice > product.price)
    .slice(0, 10)
  const merchandisingPool = Array.from(new Map([...catalog, ...featuredProducts, ...latestProducts].map(product => [product.id, product])).values())
  const heroPatterns = [/iphone 15 pro max/i, /jbl charge 5/i, /apple watch series/i, /rechargeable.*fan/i, /hp monitor/i, /redmi pad/i, /soundcore boom/i]
  const curatedHero = heroPatterns
    .map(pattern => merchandisingPool.find(product => product.stock > 0 && pattern.test(product.name)))
    .filter((product): product is Product => Boolean(product))
  const dealProducts = hotDeals.length > 0
    ? hotDeals
    : Array.from(new Map([...curatedHero, ...featuredProducts].map(product => [product.id, product])).values()).slice(0, 10)

  const categoryById = new Map(categoryRows.map(category => [category.id, category]))
  const productsByCategory = new Map<string, Product[]>()
  for (const product of catalog) {
    let categoryId: string | null | undefined = product.categoryId
    const visited = new Set<string>()

    while (categoryId && !visited.has(categoryId)) {
      visited.add(categoryId)
      const category = categoryById.get(categoryId)
      if (!category) break

      const categoryProducts = productsByCategory.get(category.slug) ?? []
      categoryProducts.push(product)
      productsByCategory.set(category.slug, categoryProducts)
      categoryId = category.parentId
    }
  }

  const categoryShelves = categoryRows
    .filter(category => !category.parentId && category.productCount > 0)
    .map(category => ({
      slug: category.slug,
      title: category.name,
      href: `/categories/${category.slug}`,
      products: (productsByCategory.get(category.slug) ?? []).slice(0, 4),
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
    hotDeals: dealProducts,
    newest: latestProducts,
    raffles: homeRaffles,
  }
}

export default async function HomePage() {
  const { categoryIcons, categoryShelves, brands, featured, hotDeals, newest, raffles: activeRaffles } = await getHomeData()

  const shelfBackgrounds = ['bg-background', 'bg-muted']

  return (
    <div className="animate-page-reveal bg-background">
      <Hero />
      <HotDealsCarousel products={hotDeals} />
      <CategoryIconGrid title="Shop by category" categories={categoryIcons} />
      <ProductShelf title="Latest arrivals" href="/shop?sort=newest" products={newest} columns={6} compact className="bg-[#F5F6F5]" />
      <ProductShelf title="Featured picks" href="/shop?sort=popular" products={featured} columns={6} compact className="bg-background" />

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
