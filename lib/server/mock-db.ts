import { MOCK_CATEGORIES, MOCK_ORDERS, MOCK_PRODUCTS, MOCK_RAFFLES } from '@/lib/mock-data'
import type { Category } from '@/lib/services/category.service'
import type { Order } from '@/lib/services/order.service'
import type { Product, ProductReview } from '@/lib/services/product.service'
import type { Raffle } from '@/lib/services/raffle.service'
import type { User, UserRole } from '@/lib/services/auth.service'

interface UserRecord extends User {
  password: string
}

const nowIso = () => new Date().toISOString()

const seedUsers: UserRecord[] = [
  {
    id: 'u-1',
    name: 'Alex Johnson',
    email: 'alex@example.com',
    role: 'customer',
    password: 'password123',
    isVerified: true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 'u-aff-1',
    name: 'Maya Affiliate',
    email: 'affiliate@example.com',
    role: 'affiliate',
    password: 'password123',
    affiliateCode: 'MAYA10',
    isVerified: true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 'u-admin-1',
    name: 'Admin User',
    email: 'admin@valgadget.com',
    role: 'admin',
    password: 'admin12345',
    isVerified: true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
]

const users = new Map<string, UserRecord>(seedUsers.map(user => [user.id, user]))
const products = [...MOCK_PRODUCTS]
const categories = [...MOCK_CATEGORIES]
const raffles = [...MOCK_RAFFLES]
const orders = [...MOCK_ORDERS]
const reviews = new Map<string, ProductReview[]>()

function sanitizeUser(user: UserRecord): User {
  const { password: _password, ...safe } = user
  return safe
}

function newId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

export const db = {
  users: {
    list: () => Array.from(users.values()).map(sanitizeUser),
    findById: (id: string) => {
      const user = users.get(id)
      return user ? sanitizeUser(user) : null
    },
    findByEmail: (email: string) => {
      const normalized = email.toLowerCase().trim()
      return Array.from(users.values()).find(u => u.email.toLowerCase() === normalized) ?? null
    },
    verifyPassword: (email: string, password: string) => {
      const user = db.users.findByEmail(email)
      if (!user) return null
      const rawUser = users.get(user.id)
      if (!rawUser || rawUser.password !== password) return null
      return sanitizeUser(rawUser)
    },
    create: (payload: { name: string; email: string; password: string; role?: UserRole; affiliateCode?: string }) => {
      const existing = db.users.findByEmail(payload.email)
      if (existing) return { user: null, error: 'Email already in use.' }

      const record: UserRecord = {
        id: newId('u'),
        name: payload.name,
        email: payload.email.toLowerCase().trim(),
        role: payload.role ?? 'customer',
        affiliateCode: payload.affiliateCode,
        password: payload.password,
        isVerified: false,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      }

      users.set(record.id, record)
      return { user: sanitizeUser(record), error: null }
    },
  },
  products: {
    list: () => [...products],
    findById: (id: string) => products.find(product => product.id === id) ?? null,
    findBySlug: (slug: string) => products.find(product => product.slug === slug) ?? null,
    related: (id: string, limit = 6) => {
      const product = db.products.findById(id)
      if (!product) return []
      return products
        .filter(item => item.categoryId === product.categoryId && item.id !== id)
        .slice(0, limit)
    },
    reviews: {
      list: (productId: string) => reviews.get(productId) ?? [],
      add: (productId: string, payload: { rating: number; title?: string; body: string; user: User }) => {
        const product = db.products.findById(productId)
        if (!product) return null

        const review: ProductReview = {
          id: newId('rev'),
          userId: payload.user.id,
          user: { name: payload.user.name, avatar: payload.user.avatar },
          rating: payload.rating,
          title: payload.title,
          body: payload.body,
          verified: true,
          createdAt: nowIso(),
        }

        const existing = reviews.get(productId) ?? []
        const next = [review, ...existing]
        reviews.set(productId, next)

        const totalRating = next.reduce((acc, item) => acc + item.rating, 0)
        product.reviewCount = next.length
        product.rating = Number((totalRating / next.length).toFixed(1))

        return review
      },
    },
  },
  categories: {
    list: () => [...categories],
    findById: (id: string) => categories.find(category => category.id === id) ?? null,
    findBySlug: (slug: string) => categories.find(category => category.slug === slug) ?? null,
    withCounts: () =>
      categories.map(category => ({
        ...category,
        productCount: products.filter(product => product.categoryId === category.id).length,
      } as Category)),
  },
  raffles: {
    list: () => [...raffles],
    findById: (id: string) => raffles.find(raffle => raffle.id === id) ?? null,
  },
  orders: {
    list: () => [...orders],
    byUser: (userId: string) => orders.filter(order => order.userId === userId),
    findById: (id: string) => orders.find(order => order.id === id) ?? null,
    create: (order: Order) => {
      orders.unshift(order)
      return order
    },
  },
}
