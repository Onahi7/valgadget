import { db } from '@/lib/server/db'
import { products } from '@/lib/server/schema'
import { desc, eq } from 'drizzle-orm'

type CategoryImageRow = {
  id: string
  image?: string | null
  parentId?: string | null
}

type ProductImageRow = {
  categoryId: string | null
  images: string[]
}

function usableImage(src?: string | null) {
  return Boolean(src && !src.includes('source.unsplash.com'))
}

function firstUsableProductImage(product?: ProductImageRow) {
  return product?.images?.find(usableImage) ?? null
}

export async function withCategoryDisplayImages<T extends CategoryImageRow>(categoriesList: T[]) {
  const productRows = await db.select({
    categoryId: products.categoryId,
    images: products.images,
  })
    .from(products)
    .where(eq(products.isActive, true))
    .orderBy(desc(products.createdAt))

  const childIdsByParent = new Map<string, string[]>()
  for (const category of categoriesList) {
    if (!category.parentId) continue
    childIdsByParent.set(category.parentId, [...(childIdsByParent.get(category.parentId) ?? []), category.id])
  }

  return categoriesList.map(category => {
    const categoryImage = usableImage(category.image) ? category.image! : null
    const childIds = childIdsByParent.get(category.id) ?? []
    const productImage = firstUsableProductImage(productRows.find(product =>
      product.categoryId === category.id || childIds.includes(product.categoryId ?? '')
    ))
    const displayImage = categoryImage ?? productImage

    return {
      ...category,
      displayImage,
      imageStatus: displayImage ? 'ready' : 'needs_image',
    }
  })
}
