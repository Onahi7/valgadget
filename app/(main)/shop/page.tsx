import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { and, asc, desc, eq, sql, inArray } from 'drizzle-orm'
import { ProductShelf } from '@/components/ecommerce/product-shelf'
import { CategoryIconGrid, type CategoryIcon } from '@/components/ecommerce/category-icon-grid'
import { db } from '@/lib/server/db'
import { categories, products } from '@/lib/server/schema'
import { getProducts } from '@/lib/server/product-helpers'

export const dynamic = 'force-dynamic'

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
      .map(async cat => {
        const children = await db
          .select({ id: categories.id })
          .from(categories)
          .where(eq(categories.parentId, cat.id))
        const categoryIds = [cat.id, ...children.map(c => c.id)]

        const prods = await getProducts({
          where: and(activeProducts, inArray(products.categoryId, categoryIds)),
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
  const subcategoryBanners = categoryRows
    .filter(category => category.parentId && category.image && category.productCount > 0)
    .slice(0, 3)
    .map(category => ({ label: category.name, slug: category.slug, image: category.image! }))

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
                <div className="border-t border-border bg-card p-4">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">{card.label}</h3>
                  <span className="mt-1 inline-flex items-center text-xs font-medium text-muted-foreground group-hover:text-foreground">
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

    </div>
  )
}
