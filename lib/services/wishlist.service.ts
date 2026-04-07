import { api } from '@/lib/api-client'
import type { Product } from './product.service'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WishlistItem {
  id: string
  productId: string
  product: Product
  addedAt: string
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const wishlistService = {
  /** Get current user's wishlist */
  getAll: () =>
    api.get<WishlistItem[]>('/wishlist'),

  /** Add a product to wishlist */
  add: (productId: string) =>
    api.post<WishlistItem>('/wishlist', { productId }),

  /** Remove a product from wishlist */
  remove: (productId: string) =>
    api.delete<{ message: string }>(`/wishlist/${productId}`),

  /** Check if a product is in the wishlist */
  check: (productId: string) =>
    api.get<{ isInWishlist: boolean }>(`/wishlist/check/${productId}`),

  /** Clear entire wishlist */
  clear: () =>
    api.delete<{ message: string }>('/wishlist'),

  /** Move wishlist item to cart (shortcut) */
  moveToCart: (productId: string) =>
    api.post<{ message: string }>('/wishlist/move-to-cart', { productId }),
}
