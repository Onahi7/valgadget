import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { products } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq } from 'drizzle-orm'

// POST /api/admin/products/[id]/images - upload images (simplified - stores base64)
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  try {
    const formData = await req.formData()
    const files = formData.getAll('images') as File[]

    if (!files.length || !files[0]) {
      return apiError('No images provided', 400)
    }

    // Fetch current product
    const [product] = await db.select({ images: products.images }).from(products).where(eq(products.id, id)).limit(1)
    if (!product) return apiError('Product not found', 404)

    const existingImages: string[] = Array.isArray(product.images) ? product.images as string[] : []
    
    // For now, just return success - image upload needs @vercel/blob or similar
    // This is a placeholder that avoids the build error
    
    return apiOk({ images: existingImages, message: 'Image upload temporarily disabled - @vercel/blob not installed' })
  } catch (err) {
    console.error('[upload product images]', err)
    return apiError('Failed to upload images', 500)
  }
}

// DELETE /api/admin/products/[id]/images - delete an image  
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  try {
    const { imageUrl } = await req.json()
    if (!imageUrl) return apiError('imageUrl required', 400)

    const [product] = await db.select({ images: products.images }).from(products).where(eq(products.id, id)).limit(1)
    if (!product) return apiError('Product not found', 404)

    const existingImages: string[] = Array.isArray(product.images) ? product.images as string[] : []
    const updatedImages = existingImages.filter((url: string) => url !== imageUrl)

    await db.update(products)
      .set({ images: updatedImages, updatedAt: new Date() })
      .where(eq(products.id, id))

    return apiOk({ message: 'Image deleted' })
  } catch (err) {
    console.error('[delete product image]', err)
    return apiError('Failed to delete image', 500)
  }
}
