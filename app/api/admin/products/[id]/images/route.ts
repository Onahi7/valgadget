import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { products } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq } from 'drizzle-orm'
import { uploadFile } from '@/lib/server/imagekit'

// POST /api/admin/products/[id]/images - upload one or more product images
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  try {
    const { id } = await context.params
    const formData = await req.formData()
    const files = formData.getAll('images').filter((entry): entry is File => entry instanceof File)

    if (!files.length) return apiError('No images provided', 400)

    const [product] = await db.select({ images: products.images }).from(products).where(eq(products.id, id)).limit(1)
    if (!product) return apiError('Product not found', 404)

    const existingImages: string[] = Array.isArray(product.images) ? (product.images as string[]) : []
    const uploadedUrls: string[] = []

    for (const file of files) {
      if (!file.type.startsWith('image/')) return apiError(`Unsupported file type: ${file.type}`, 400)
      if (file.size > 5 * 1024 * 1024) return apiError(`File too large: ${file.name}. Max 5MB.`, 400)

      const bytes = await file.arrayBuffer()
      const base64 = Buffer.from(bytes).toString('base64')
      const dataUri = `data:${file.type};base64,${base64}`
      const uploaded = await uploadFile(dataUri, file.name, `/valgadget/products/${id}`)
      uploadedUrls.push(uploaded.url)
    }

    const updatedImages = [...existingImages, ...uploadedUrls]
    await db.update(products).set({ images: updatedImages, updatedAt: new Date() }).where(eq(products.id, id))

    return apiOk({ images: updatedImages })
  } catch (err) {
    console.error('[upload product images]', err)
    return apiError('Failed to upload images', 500)
  }
}

// DELETE /api/admin/products/[id]/images - remove image URL from product
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  try {
    const { id } = await context.params
    const { imageUrl } = await req.json()
    if (!imageUrl) return apiError('imageUrl required', 400)

    const [product] = await db.select({ images: products.images }).from(products).where(eq(products.id, id)).limit(1)
    if (!product) return apiError('Product not found', 404)

    const existingImages: string[] = Array.isArray(product.images) ? (product.images as string[]) : []
    const updatedImages = existingImages.filter((url) => url !== imageUrl)

    await db.update(products).set({ images: updatedImages, updatedAt: new Date() }).where(eq(products.id, id))
    return apiOk({ images: updatedImages, message: 'Image deleted' })
  } catch (err) {
    console.error('[delete product image]', err)
    return apiError('Failed to delete image', 500)
  }
}
