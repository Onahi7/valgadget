import { api } from '@/lib/api-client'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image?: string
  icon?: string
  productCount?: number
  parentId?: string
  parent?: { id: string; name: string; slug: string }
  children?: Category[]
  isActive: boolean
  sortOrder?: number
  createdAt: string
  updatedAt: string
}

export interface CreateCategoryPayload {
  name: string
  description?: string
  image?: string
  icon?: string
  parentId?: string
  isActive?: boolean
  sortOrder?: number
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const categoryService = {
  /** All active categories (tree structure) */
  getAll: () =>
    api.get<Category[]>('/categories'),

  /** Flat list with product counts */
  getFlat: () =>
    api.get<Category[]>('/categories/flat'),

  /** Single category by slug */
  getBySlug: (slug: string) =>
    api.get<Category>(`/categories/slug/${slug}`),

  /** Single category by ID */
  getById: (id: string) =>
    api.get<Category>(`/categories/${id}`),

  // ── Admin ──────────────────────────────────────────────────────────────────

  /** [Admin] Create category */
  create: (payload: CreateCategoryPayload) =>
    api.post<Category>('/admin/categories', payload),

  /** [Admin] Update category */
  update: (id: string, payload: Partial<CreateCategoryPayload>) =>
    api.put<Category>(`/admin/categories/${id}`, payload),

  /** [Admin] Delete category */
  delete: (id: string) =>
    api.delete<{ message: string }>(`/admin/categories/${id}`),

  /** [Admin] Reorder categories */
  reorder: (items: { id: string; sortOrder: number }[]) =>
    api.patch<{ updated: number }>('/admin/categories/reorder', { items }),
}
