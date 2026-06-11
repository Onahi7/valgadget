import type { Product } from '@/lib/services/product.service'

/** Extract the subset of Product fields needed for cart line items. */
export function toCartItem(product: Product) {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    images: product.images,
    price: product.price,
    sku: product.sku,
    stock: product.stock,
  }
}

/** Extract the subset of Product fields needed for wishlist items. */
export function toWishlistItem(product: Product) {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    images: product.images,
    price: product.price,
    comparePrice: product.comparePrice,
    stock: product.stock,
    sku: product.sku,
  }
}
