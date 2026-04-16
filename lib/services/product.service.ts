import { api } from '@/lib/api-client'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProductImage {
  id: string
  url: string
  alt?: string
  isPrimary: boolean
}

export interface ProductVariant {
  id: string
  name: string
  value: string
  stock: number
  priceModifier: number
}

export interface ProductReview {
  id: string
  userId: string
  user: { name: string; avatar?: string }
  rating: number
  title?: string
  body: string
  verified: boolean
  createdAt: string
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  shortDescription?: string
  price: number
  comparePrice?: number
  cost?: number          // admin only
  images: string[]
  categoryId: string
  category?: { id: string; name: string; slug: string }
  stock: number
  lowStockThreshold?: number
  sku: string
  barcode?: string
  weight?: number
  dimensions?: { length: number; width: number; height: number }
  rating: number
  reviewCount: number
  tags: string[]
  featured: boolean
  isNew: boolean
  isActive: boolean
  variants?: ProductVariant[]
  reviews?: ProductReview[]
  relatedIds?: string[]
  createdAt: string
  updatedAt: string
}

export interface ProductsResponse {
  data: Product[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ProductFilters {
  page?: number
  limit?: number
  category?: string
  search?: string
  minPrice?: number
  maxPrice?: number
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'popular' | 'rating'
  featured?: boolean
  isNew?: boolean
  tag?: string
  inStock?: boolean
}

export interface CreateProductPayload {
  name: string
  description: string
  shortDescription?: string
  price: number
  comparePrice?: number
  cost?: number
  categoryId: string
  stock: number
  lowStockThreshold?: number
  sku: string
  tags?: string[]
  featured?: boolean
  isNew?: boolean
  isActive?: boolean
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const productService = {
  /** Paginated, filtered product list */
  getAll: (filters?: ProductFilters) =>
    api.get<ProductsResponse>('/products', filters as Record<string, string | number | boolean | undefined | null>),

  /** Single product by ID */
  getById: (id: string) =>
    api.get<Product>(`/products/${id}`),

  /** Single product by slug (public) */
  getBySlug: (slug: string) =>
    api.get<Product>(`/products/slug/${slug}`),

  /** Homepage featured products */
  getFeatured: (limit = 8) =>
    api.get<Product[]>('/products/featured', { limit }),

  /** New arrivals */
  getNewArrivals: (limit = 8) =>
    api.get<Product[]>('/products/new-arrivals', { limit }),

  /** Related products for a given product */
  getRelated: (id: string, limit = 6) =>
    api.get<Product[]>(`/products/${id}/related`, { limit }),

  /** Submit a review */
  submitReview: (id: string, payload: { rating: number; title?: string; body: string }) =>
    api.post<ProductReview>(`/products/${id}/reviews`, payload),

  /** Get reviews for a product */
  getReviews: (id: string, params?: { page?: number; limit?: number }) =>
    api.get<{ data: ProductReview[]; total: number }>(`/products/${id}/reviews`, params),

  // ── Admin ──────────────────────────────────────────────────────────────────

  /** [Admin] Create product */
  create: (payload: CreateProductPayload) =>
    api.post<Product>('/admin/products', payload),

  /** [Admin] Update product */
  update: (id: string, payload: Partial<CreateProductPayload>) =>
    api.put<Product>(`/admin/products/${id}`, payload),

  /** [Admin] Soft-delete product */
  delete: (id: string) =>
    api.delete<{ message: string }>(`/admin/products/${id}`),

  /** [Admin] Upload product images */
  uploadImages: (id: string, formData: FormData) =>
    api.upload<{ images: string[] }>(`/admin/products/${id}/images`, formData),

  /** [Admin] Delete a product image */
  deleteImage: (id: string, imageUrl: string) =>
    api.delete<{ message: string }>(`/admin/products/${id}/images`, { imageUrl }),

  /** [Admin] Bulk update stock */
  bulkUpdateStock: (updates: { id: string; stock: number }[]) =>
    api.patch<{ updated: number }>('/admin/products/bulk-stock', { updates }),

  /** [Admin] Low-stock report */
  getLowStock: (threshold?: number) =>
    api.get<Product[]>('/admin/products/low-stock', threshold ? { threshold } : undefined),
}
