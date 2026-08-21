import type { Metadata } from 'next'
import { cache } from 'react'
import { db } from '@/lib/server/db'
import { categories } from '@/lib/server/schema'
import { and, asc, eq, sql } from 'drizzle-orm'
import { CategoryDetailClient } from './category-detail-client'
import { withCategoryDisplayImages } from '@/lib/server/category-images'

interface PageProps {
  params: Promise<{ slug: string }>
}

const getCategory = cache(async (slug: string) => {
  const [category] = await db
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
    })
    .from(categories)
    .where(and(
      eq(categories.slug, slug),
      eq(categories.isActive, true),
      sql`exists (
        select 1
        from products p
        where p.is_active = true
          and (
            p.category_id = ${categories.id}
            or p.category_id in (select c2.id from categories c2 where c2.parent_id = ${categories.id} and c2.is_active = true)
          )
      )`,
    ))
    .limit(1)

  if (!category) return null

  const [categoryWithImage] = await withCategoryDisplayImages([{
    ...category,
    description: category.description ?? undefined,
    image: category.image ?? undefined,
    coverImage: category.coverImage ?? undefined,
    icon: category.icon ?? undefined,
    parentId: category.parentId ?? undefined,
    sortOrder: category.sortOrder ?? undefined,
    createdAt: category.createdAt instanceof Date ? category.createdAt.toISOString() : String(category.createdAt),
    updatedAt: category.updatedAt instanceof Date ? category.updatedAt.toISOString() : String(category.updatedAt),
  }])

  return categoryWithImage
})

async function getSubcategories(parentId: string) {
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      image: categories.image,
    })
    .from(categories)
    .where(and(
      eq(categories.parentId, parentId),
      eq(categories.isActive, true),
      sql`exists (select 1 from products p where p.is_active = true and p.category_id = ${categories.id})`,
    ))
    .orderBy(asc(categories.sortOrder))
  return withCategoryDisplayImages(rows)
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const category = await getCategory(slug)

  if (!category) {
    return { title: 'Category Not Found' }
  }

  const description = category.description || `Browse ${category.name} products at Val Gadgets - Quality tech gadgets and accessories`
  const image = category.coverImage || category.displayImage || category.image

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
  const subcategories = category ? await getSubcategories(category.id) : []

  return <CategoryDetailClient slug={slug} initialCategory={category} subcategories={subcategories} />
}
