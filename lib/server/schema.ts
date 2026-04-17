/**
 * Drizzle ORM schema — ValGadget
 * All tables for Neon Postgres.
 */
import {
  pgTable,
  text,
  varchar,
  integer,
  numeric,
  boolean,
  timestamp,
  json,
  index,
  primaryKey,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ─── Users ─────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id:              text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name:            varchar('name', { length: 200 }).notNull(),
  email:           varchar('email', { length: 255 }).notNull().unique(),
  passwordHash:    text('password_hash').notNull(),
  role:            varchar('role', { length: 20 }).notNull().default('customer'),
  avatar:          text('avatar'),
  phone:           varchar('phone', { length: 30 }),
  isVerified:      boolean('is_verified').notNull().default(false),
  verifyToken:     text('verify_token'),
  resetToken:      text('reset_token'),
  resetExpires:    timestamp('reset_expires'),
  affiliateCode:   varchar('affiliate_code', { length: 30 }).unique(),
  affiliateBalance: numeric('affiliate_balance', { precision: 10, scale: 2 }).default('0'),
  createdAt:       timestamp('created_at').notNull().defaultNow(),
  updatedAt:       timestamp('updated_at').notNull().defaultNow(),
}, t => [
  index('users_email_idx').on(t.email),
  index('users_role_idx').on(t.role),
])

// ─── Categories ────────────────────────────────────────────────────────────

export const categories = pgTable('categories', {
  id:          text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name:        varchar('name', { length: 200 }).notNull(),
  slug:        varchar('slug', { length: 220 }).notNull().unique(),
  description: text('description'),
  image:       text('image'),
  icon:        varchar('icon', { length: 50 }),
  parentId:    text('parent_id'),
  isActive:    boolean('is_active').notNull().default(true),
  sortOrder:   integer('sort_order').default(0),
  createdAt:   timestamp('created_at').notNull().defaultNow(),
  updatedAt:   timestamp('updated_at').notNull().defaultNow(),
}, t => [
  index('categories_slug_idx').on(t.slug),
])

// ─── Products ──────────────────────────────────────────────────────────────

export const products = pgTable('products', {
  id:               text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name:             varchar('name', { length: 300 }).notNull(),
  slug:             varchar('slug', { length: 320 }).notNull().unique(),
  description:      text('description').notNull().default(''),
  shortDescription: text('short_description'),
  price:            numeric('price', { precision: 10, scale: 2 }).notNull(),
  comparePrice:     numeric('compare_price', { precision: 10, scale: 2 }),
  cost:             numeric('cost', { precision: 10, scale: 2 }),
  images:           json('images').$type<string[]>().notNull().default([]),
  categoryId:       text('category_id').references(() => categories.id),
  stock:            integer('stock').notNull().default(0),
  lowStockThreshold: integer('low_stock_threshold').default(5),
  sku:              varchar('sku', { length: 100 }).notNull().unique(),
  barcode:          varchar('barcode', { length: 100 }),
  weight:           numeric('weight', { precision: 8, scale: 3 }),
  rating:           numeric('rating', { precision: 3, scale: 2 }).notNull().default('0'),
  reviewCount:      integer('review_count').notNull().default(0),
  tags:             json('tags').$type<string[]>().notNull().default([]),
  featured:         boolean('featured').notNull().default(false),
  isNew:            boolean('is_new').notNull().default(false),
  isActive:         boolean('is_active').notNull().default(true),
  createdAt:        timestamp('created_at').notNull().defaultNow(),
  updatedAt:        timestamp('updated_at').notNull().defaultNow(),
}, t => [
  index('products_slug_idx').on(t.slug),
  index('products_category_idx').on(t.categoryId),
  index('products_featured_idx').on(t.featured),
  index('products_active_idx').on(t.isActive),
])

// ─── Reviews ───────────────────────────────────────────────────────────────

export const reviews = pgTable('reviews', {
  id:         text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId:  text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  userId:     text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  rating:     integer('rating').notNull(),
  title:      varchar('title', { length: 200 }),
  body:       text('body').notNull(),
  verified:   boolean('verified').notNull().default(false),
  createdAt:  timestamp('created_at').notNull().defaultNow(),
}, t => [
  index('reviews_product_idx').on(t.productId),
])

// ─── Orders ────────────────────────────────────────────────────────────────

export const orders = pgTable('orders', {
  id:              text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  reference:       varchar('reference', { length: 30 }).notNull().unique(),
  userId:          text('user_id').references(() => users.id),
  status:          varchar('status', { length: 30 }).notNull().default('pending'),
  paymentStatus:   varchar('payment_status', { length: 30 }).notNull().default('unpaid'),
  paymentMethod:   varchar('payment_method', { length: 50 }),
  paymentRef:      text('payment_ref'),
  items:           json('items').$type<OrderItem[]>().notNull().default([]),
  subtotal:        numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  discount:        numeric('discount', { precision: 10, scale: 2 }).default('0'),
  shipping:        numeric('shipping', { precision: 10, scale: 2 }).default('0'),
  tax:             numeric('tax', { precision: 10, scale: 2 }).default('0'),
  total:           numeric('total', { precision: 10, scale: 2 }).notNull(),
  couponCode:      varchar('coupon_code', { length: 50 }),
  affiliateCode:   varchar('affiliate_code', { length: 30 }),
  shippingAddress: json('shipping_address').$type<Address>(),
  notes:           text('notes'),
  createdAt:       timestamp('created_at').notNull().defaultNow(),
  updatedAt:       timestamp('updated_at').notNull().defaultNow(),
}, t => [
  index('orders_user_idx').on(t.userId),
  index('orders_status_idx').on(t.status),
  index('orders_reference_idx').on(t.reference),
])

export interface OrderItem {
  productId: string
  name: string
  sku: string
  price: number
  qty: number
  image?: string
}

export interface Address {
  fullName: string
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
  phone?: string
}

// ─── Raffles ───────────────────────────────────────────────────────────────

export const raffles = pgTable('raffles', {
  id:           text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title:        varchar('title', { length: 300 }).notNull(),
  description:  text('description').notNull().default(''),
  image:        text('image'),
  prize:        varchar('prize', { length: 300 }).notNull(),
  prizeValue:   numeric('prize_value', { precision: 10, scale: 2 }).notNull(),
  ticketPrice:  numeric('ticket_price', { precision: 10, scale: 2 }).notNull(),
  maxTickets:   integer('max_tickets').notNull(),
  soldTickets:  integer('sold_tickets').notNull().default(0),
  status:       varchar('status', { length: 20 }).notNull().default('upcoming'),
  drawDate:     timestamp('draw_date').notNull(),
  winnerId:     text('winner_id').references(() => users.id),
  winnerTicket: integer('winner_ticket'),
  createdAt:    timestamp('created_at').notNull().defaultNow(),
  updatedAt:    timestamp('updated_at').notNull().defaultNow(),
}, t => [
  index('raffles_status_idx').on(t.status),
])

export const raffleEntries = pgTable('raffle_entries', {
  id:           text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  raffleId:     text('raffle_id').notNull().references(() => raffles.id, { onDelete: 'cascade' }),
  userId:       text('user_id').notNull().references(() => users.id),
  ticketCount:  integer('ticket_count').notNull().default(1),
  ticketNums:   json('ticket_nums').$type<number[]>().notNull().default([]),
  totalPaid:    numeric('total_paid', { precision: 10, scale: 2 }).notNull(),
  createdAt:    timestamp('created_at').notNull().defaultNow(),
}, t => [
  index('raffle_entries_raffle_idx').on(t.raffleId),
  index('raffle_entries_user_idx').on(t.userId),
])

// ─── Affiliate clicks ──────────────────────────────────────────────────────

export const affiliateClicks = pgTable('affiliate_clicks', {
  id:          text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  code:        varchar('code', { length: 30 }).notNull(),
  userId:      text('user_id').references(() => users.id),
  ip:          varchar('ip', { length: 45 }),
  referrer:    text('referrer'),
  userAgent:   text('user_agent'),
  convertedAt: timestamp('converted_at'),
  orderId:     text('order_id').references(() => orders.id),
  commission:  numeric('commission', { precision: 10, scale: 2 }),
  createdAt:   timestamp('created_at').notNull().defaultNow(),
}, t => [
  index('aff_clicks_code_idx').on(t.code),
])

// ─── Shipping Rates (Nigerian States) ─────────────────────────────────────

export const shippingRates = pgTable('shipping_rates', {
  id:          text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  state:       varchar('state', { length: 100 }).notNull().unique(),
  price:       numeric('price', { precision: 10, scale: 2 }).notNull(),
  estimatedDays: integer('estimated_days').notNull().default(3),
  isActive:    boolean('is_active').notNull().default(true),
  updatedAt:   timestamp('updated_at').notNull().defaultNow(),
})

// ─── Site Settings ─────────────────────────────────────────────────────────

export const siteSettings = pgTable('site_settings', {
  key:       varchar('key', { length: 100 }).primaryKey(),
  value:     text('value').notNull().default(''),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ─── Relations ─────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  orders:   many(orders),
  reviews:  many(reviews),
  entries:  many(raffleEntries),
}))

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}))

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  reviews:  many(reviews),
}))

export const ordersRelations = relations(orders, ({ one }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
}))

export const rafflesRelations = relations(raffles, ({ many }) => ({
  entries: many(raffleEntries),
}))

// ─── Chat ──────────────────────────────────────────────────────────────────

export const chatSessions = pgTable('chat_sessions', {
  id:         text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId:     text('user_id').references(() => users.id, { onDelete: 'set null' }),
  guestName:  varchar('guest_name', { length: 200 }),
  guestEmail: varchar('guest_email', { length: 255 }),
  subject:    varchar('subject', { length: 500 }),
  productId:  text('product_id').references(() => products.id, { onDelete: 'set null' }),
  status:     varchar('status', { length: 20 }).notNull().default('open'), // open | closed
  createdAt:  timestamp('created_at').notNull().defaultNow(),
  updatedAt:  timestamp('updated_at').notNull().defaultNow(),
}, t => [
  index('chat_sessions_user_idx').on(t.userId),
  index('chat_sessions_status_idx').on(t.status),
])

export const chatMessages = pgTable('chat_messages', {
  id:        text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionId: text('session_id').notNull().references(() => chatSessions.id, { onDelete: 'cascade' }),
  role:      varchar('role', { length: 20 }).notNull(), // 'user' | 'admin'
  senderName: varchar('sender_name', { length: 200 }),
  content:   text('content').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, t => [
  index('chat_messages_session_idx').on(t.sessionId),
])

export const chatSessionsRelations = relations(chatSessions, ({ many, one }) => ({
  messages: many(chatMessages),
  user:     one(users, { fields: [chatSessions.userId], references: [users.id] }),
}))

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  session: one(chatSessions, { fields: [chatMessages.sessionId], references: [chatSessions.id] }),
}))
