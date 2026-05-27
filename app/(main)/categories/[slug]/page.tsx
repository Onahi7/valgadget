import type { Metadata } from 'next'
import { db } from '@/lib/server/db'
import { categories } from '@/lib/server/schema'
import { eq } from 'drizzle-orm'
import { CategoryDetailClient } from './category-detail-client'
import { withCategoryDisplayImages } from '@/lib/server/category-images'

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getCategory(slug: string) {
  const [category] = await db
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
    })
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1)

  if (!category || !category.isActive) return null

  const [categoryWithImage] = await withCategoryDisplayImages([{
    ...category,
    description: category.description ?? undefined,
    image: category.image ?? undefined,
    icon: category.icon ?? undefined,
    parentId: category.parentId ?? undefined,
    sortOrder: category.sortOrder ?? undefined,
    createdAt: category.createdAt instanceof Date ? category.createdAt.toISOString() : String(category.createdAt),
    updatedAt: category.updatedAt instanceof Date ? category.updatedAt.toISOString() : String(category.updatedAt),
  }])

  return categoryWithImage
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const category = await getCategory(slug)

  if (!category) {
    return { title: 'Category Not Found' }
  }

  const description = category.description || `Browse ${category.name} products at Val Gadgets - Quality tech gadgets and accessories`
  const image = category.displayImage || category.image

  return {
    title: `${category.name} | Val Gadgets`,
    description,
    openGraph: {
      title: `${category.name} | Val Gadgets`,
      description,
      type: 'website',
      ...(image ? { images: [{ url: image, width: 1200, height: 630, alt: category.name }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${category.name} | Val Gadgets`,
      description,
      ...(image ? { images: [image] } : {}),
    },
  }
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params
  const category = await getCategory(slug)

  return <CategoryDetailClient slug={slug} initialCategory={category} />
}
