import type { Metadata } from 'next'
import { db } from '@/lib/server/db'
import { products, categories } from '@/lib/server/schema'
import { eq } from 'drizzle-orm'
import { ProductDetailClient } from './product-detail-client'

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getProduct(slug: string) {
  const [product] = await db.select({
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
  })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.slug, slug))
    .limit(1)

  if (!product) return null

  return {
    ...product,
    price: Number(product.price),
    comparePrice: product.comparePrice ? Number(product.comparePrice) : undefined,
    rating: Number(product.rating ?? 0),
    categoryId: product.categoryId ?? '',
    tags: product.tags ?? [],
    specs: product.specs ?? [],
    images: product.images ?? [],
    shortDescription: product.shortDescription ?? undefined,
    category: product.category ?? undefined,
    createdAt: product.createdAt instanceof Date ? product.createdAt.toISOString() : String(product.createdAt),
    updatedAt: product.updatedAt instanceof Date ? product.updatedAt.toISOString() : String(product.updatedAt),
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) {
    return { title: 'Product Not Found' }
  }

  const description = product.shortDescription || product.description?.slice(0, 160) || `Buy ${product.name} at Val Gadgets`
  const image = product.images[0]

  return {
    title: product.name,
    description,
    openGraph: {
      title: `${product.name} | Val Gadgets`,
      description,
      type: 'website',
      ...(image ? { images: [{ url: image, width: 800, height: 800, alt: product.name }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description,
      ...(image ? { images: [image] } : {}),
    },
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params
  const product = await getProduct(slug)

  const jsonLd = product ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription || product.description?.slice(0, 500),
    image: product.images,
    sku: product.sku,
    brand: { '@type': 'Brand', name: 'ValGadget' },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'NGN',
      price: product.price,
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://valgadgets.com'}/products/${product.slug}`,
    },
    aggregateRating: product.reviewCount > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
    } : undefined,
  } : null

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductDetailClient slug={slug} initialProduct={product} />
    </>
  )
}
