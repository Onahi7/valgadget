import type { MetadataRoute } from 'next'
import { db } from '@/lib/server/db'
import { products, categories } from '@/lib/server/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://valgadgets.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    { url: '', changeFrequency: 'daily' as const, priority: 1 },
    { url: '/shop', changeFrequency: 'daily' as const, priority: 0.9 },
    { url: '/deals', changeFrequency: 'daily' as const, priority: 0.8 },
    { url: '/categories', changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: '/raffles', changeFrequency: 'weekly' as const, priority: 0.7 },
    { url: '/about', changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: '/contact', changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: '/faq', changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: '/login', changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: '/register', changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: '/legal/privacy', changeFrequency: 'yearly' as const, priority: 0.5 },
    { url: '/legal/terms', changeFrequency: 'yearly' as const, priority: 0.5 },
    { url: '/legal/returns', changeFrequency: 'yearly' as const, priority: 0.5 },
    { url: '/legal/cookies', changeFrequency: 'yearly' as const, priority: 0.5 },
  ]

  const staticSitemap = staticRoutes.map(({ url, changeFrequency, priority }) => ({
    url: `${BASE_URL}${url}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }))

  // Dynamic product pages
  const productRows = await db
    .select({ slug: products.slug, updatedAt: products.updatedAt })
    .from(products)
    .where(eq(products.isActive, true))

  const productSitemap = productRows.map(p => ({
    url: `${BASE_URL}/products/${p.slug}`,
    lastModified: p.updatedAt instanceof Date ? p.updatedAt : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Dynamic category pages
  const categoryRows = await db
    .select({ slug: categories.slug })
    .from(categories)
    .where(eq(categories.isActive, true))

  const categorySitemap = categoryRows.map(c => ({
    url: `${BASE_URL}/categories/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticSitemap, ...productSitemap, ...categorySitemap]
}
