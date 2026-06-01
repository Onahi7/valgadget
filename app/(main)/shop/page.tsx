import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { and, asc, desc, eq, sql, inArray } from 'drizzle-orm'
import { ProductShelf } from '@/components/ecommerce/product-shelf'
import { CategoryIconGrid, type CategoryIcon } from '@/components/ecommerce/category-icon-grid'
import { db } from '@/lib/server/db'
import { categories, products } from '@/lib/server/schema'
import type { Product } from '@/lib/services/product.service'

export const dynamic = 'force-dynamic'

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

async function getShopData() {
  const activeProducts = eq(products.isActive, true)

  const [categoryRows, newest, featured, topSellers, topRated] = await Promise.all([
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
    getProducts({ where: activeProducts, orderBy: desc(products.createdAt), limit: 8 }),
    getProducts({ where: and(activeProducts, eq(products.featured, true)), orderBy: desc(products.createdAt), limit: 8 }),
    getProducts({ where: activeProducts, orderBy: desc(products.reviewCount), limit: 8 }),
    getProducts({ where: activeProducts, orderBy: desc(products.rating), limit: 8 }),
  ])

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

  // Get category sections with products (Tech Direct pattern)
  const categorySections = await Promise.all(
    categoryRows
      .filter(c => !c.parentId && c.productCount > 0)
      .slice(0, 6)
      .map(async cat => {
        const children = await db
          .select({ id: categories.id })
          .from(categories)
          .where(eq(categories.parentId, cat.id))
        const categoryIds = [cat.id, ...children.map(c => c.id)]

        const prods = await getProducts({
          where: inArray(products.categoryId, categoryIds),
          orderBy: desc(products.createdAt),
          limit: 6,
        })

        return {
          title: cat.name,
          href: `/categories/${cat.slug}`,
          products: prods,
        }
      })
  )

  // Get subcategory banner cards
  const subcategoryBanners = [
    { label: 'Speakers', slug: 'speakers', image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=80' },
    { label: 'Rechargeable Fans', slug: 'rechargeable-fans', image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=800&q=80' },
    { label: 'Monitors', slug: 'monitors', image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80' },
  ]

  return {
    categoryIcons,
    categorySections,
    subcategoryBanners,
    newest,
    featured,
    topSellers,
    topRated,
  }
}

export default async function ShopPage() {
  const { categoryIcons, categorySections, subcategoryBanners, newest, featured, topSellers, topRated } =
    await getShopData()

  return (
    <div className="animate-page-reveal bg-background">
      {/* ── SHOP BY CATEGORIES ────────────────────────────────────── */}
      <CategoryIconGrid categories={categoryIcons} />

      {/* ── CATEGORY SECTIONS (Tech Direct pattern) ──────────────── */}
      {categorySections.map(section => (
        <section key={section.href} className="border-t border-border py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-5 flex items-end justify-between gap-4">
              <h2 className="text-2xl font-bold">{section.title}</h2>
              <Link
                href={section.href}
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

      {/* ── SUBCATEGORY BANNER CARDS (Tech Direct pattern) ───────── */}
      <section className="border-t border-border py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {subcategoryBanners.map(card => (
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

      {/* ── CURRENT TOP SELLERS ──────────────────────────────────── */}
      <ProductShelf title="Current Top Sellers" href="/shop?sort=popular" products={topSellers} columns={4} />

      {/* ── TOP RATED ────────────────────────────────────────────── */}
      <ProductShelf title="Top Rated Products" href="/shop?sort=rating" products={topRated} columns={4} />

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
            <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
