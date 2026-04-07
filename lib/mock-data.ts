/**
 * Mock fallback data — used when backend is unavailable.
 */

import type { Product } from './services/product.service'
import type { Category } from './services/category.service'
import type { Raffle } from './services/raffle.service'
import type { Order } from './services/order.service'

export const MOCK_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Audio', slug: 'audio', description: 'Headphones, speakers, and earbuds', productCount: 24, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cat-2', name: 'Wearables', slug: 'wearables', description: 'Smartwatches and fitness trackers', productCount: 18, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cat-3', name: 'Cameras', slug: 'cameras', description: 'Action cams, drones, and lenses', productCount: 12, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cat-4', name: 'Computing', slug: 'computing', description: 'Laptops, tablets, and accessories', productCount: 31, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cat-5', name: 'Smart Home', slug: 'smart-home', description: 'Automation, lighting, and security', productCount: 15, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cat-6', name: 'Gaming', slug: 'gaming', description: 'Controllers, headsets, and gear', productCount: 22, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
]

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p-1', name: 'SonicPro X1 Headphones', slug: 'sonicpro-x1',
    description: 'Industry-leading noise cancellation meets studio-quality audio. 40-hour battery, adaptive EQ, and premium leather cushions.',
    price: 349, comparePrice: 429,
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80', 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&q=80'],
    categoryId: 'cat-1', category: { id: 'cat-1', name: 'Audio', slug: 'audio' },
    stock: 42, sku: 'SPX1-BLK', rating: 4.8, reviewCount: 312,
    tags: ['featured', 'bestseller'], featured: true, isNew: false, isActive: true,
    createdAt: '2024-03-01T00:00:00Z', updatedAt: '2024-03-01T00:00:00Z',
  },
  {
    id: 'p-2', name: 'VisionWatch Pro 5', slug: 'visionwatch-pro-5',
    description: 'Advanced health monitoring with ECG, SpO2, and GPS. Titanium frame, sapphire glass, 7-day battery life.',
    price: 599, comparePrice: 699,
    images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80'],
    categoryId: 'cat-2', category: { id: 'cat-2', name: 'Wearables', slug: 'wearables' },
    stock: 28, sku: 'VWP5-SLV', rating: 4.7, reviewCount: 189,
    tags: ['featured', 'new'], featured: true, isNew: true, isActive: true,
    createdAt: '2024-05-01T00:00:00Z', updatedAt: '2024-05-01T00:00:00Z',
  },
  {
    id: 'p-3', name: 'AeroCapture 4K Drone', slug: 'aerocapture-4k',
    description: '4K/60fps with 3-axis gimbal stabilization. 35-minute flight time, obstacle avoidance, and follow-me mode.',
    price: 899,
    images: ['https://images.unsplash.com/photo-1579829366248-204fe8413f31?w=600&q=80'],
    categoryId: 'cat-3', category: { id: 'cat-3', name: 'Cameras', slug: 'cameras' },
    stock: 15, sku: 'AC4K-GRY', rating: 4.6, reviewCount: 94,
    tags: ['premium'], featured: true, isNew: false, isActive: true,
    createdAt: '2024-02-01T00:00:00Z', updatedAt: '2024-02-01T00:00:00Z',
  },
  {
    id: 'p-4', name: 'NexPad Ultra Tablet', slug: 'nexpad-ultra',
    description: '12.9" OLED display, M3 chip, and all-day battery. Perfect for creatives and power users.',
    price: 1199,
    images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&q=80'],
    categoryId: 'cat-4', category: { id: 'cat-4', name: 'Computing', slug: 'computing' },
    stock: 20, sku: 'NPU-256', rating: 4.9, reviewCount: 267,
    tags: ['premium', 'bestseller'], featured: false, isNew: true, isActive: true,
    createdAt: '2024-06-01T00:00:00Z', updatedAt: '2024-06-01T00:00:00Z',
  },
  {
    id: 'p-5', name: 'HaloHub Smart Speaker', slug: 'halohub-speaker',
    description: 'Room-filling 360° sound with built-in AI assistant, multi-room audio, and sleek matte finish.',
    price: 199, comparePrice: 249,
    images: ['https://images.unsplash.com/photo-1543512214-318c7553f230?w=600&q=80'],
    categoryId: 'cat-5', category: { id: 'cat-5', name: 'Smart Home', slug: 'smart-home' },
    stock: 60, sku: 'HHS-BLK', rating: 4.5, reviewCount: 445,
    tags: ['bestseller'], featured: false, isNew: false, isActive: true,
    createdAt: '2024-01-10T00:00:00Z', updatedAt: '2024-01-10T00:00:00Z',
  },
  {
    id: 'p-6', name: 'PixelBuds Pro 2', slug: 'pixelbuds-pro-2',
    description: 'True wireless earbuds with adaptive ANC, 8-hour playback, and ultra-fast charging case.',
    price: 229,
    images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80'],
    categoryId: 'cat-1', category: { id: 'cat-1', name: 'Audio', slug: 'audio' },
    stock: 85, sku: 'PBP2-WHT', rating: 4.6, reviewCount: 521,
    tags: ['new', 'bestseller'], featured: true, isNew: true, isActive: true,
    createdAt: '2024-07-01T00:00:00Z', updatedAt: '2024-07-01T00:00:00Z',
  },
  {
    id: 'p-7', name: 'GameShift Controller X', slug: 'gameshift-controller-x',
    description: 'Pro-grade haptics, adjustable triggers, and 20-hour wireless battery. Compatible with all platforms.',
    price: 129, comparePrice: 159,
    images: ['https://images.unsplash.com/photo-1593118247619-e2d6f056869e?w=600&q=80'],
    categoryId: 'cat-6', category: { id: 'cat-6', name: 'Gaming', slug: 'gaming' },
    stock: 100, sku: 'GSX-BLK', rating: 4.7, reviewCount: 788,
    tags: ['bestseller'], featured: false, isNew: false, isActive: true,
    createdAt: '2024-01-15T00:00:00Z', updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'p-8', name: 'LumiCam Action Cam', slug: 'lumicam-action',
    description: 'Waterproof to 30m, 5K stabilized video, and 2-hour recording. Designed for the fearless.',
    price: 449,
    images: ['https://images.unsplash.com/photo-1530053969600-caed2596d242?w=600&q=80'],
    categoryId: 'cat-3', category: { id: 'cat-3', name: 'Cameras', slug: 'cameras' },
    stock: 33, sku: 'LAC-ORG', rating: 4.4, reviewCount: 156,
    tags: ['new'], featured: false, isNew: true, isActive: true,
    createdAt: '2024-08-01T00:00:00Z', updatedAt: '2024-08-01T00:00:00Z',
  },
  {
    id: 'p-9', name: 'FlexCore Laptop Stand', slug: 'flexcore-stand',
    description: 'Adjustable aluminium stand with cable management. Fits all laptops 11–17".',
    price: 69, comparePrice: 89,
    images: ['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80'],
    categoryId: 'cat-4', category: { id: 'cat-4', name: 'Computing', slug: 'computing' },
    stock: 0, sku: 'FCS-ALU', rating: 4.3, reviewCount: 203,
    tags: [], featured: false, isNew: false, isActive: true,
    createdAt: '2024-04-01T00:00:00Z', updatedAt: '2024-04-01T00:00:00Z',
  },
  {
    id: 'p-10', name: 'NovaCam 360 Security', slug: 'novacam-360',
    description: '4K 360° indoor/outdoor security camera with AI detection and 2-way audio.',
    price: 189, comparePrice: 219,
    images: ['https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&q=80'],
    categoryId: 'cat-5', category: { id: 'cat-5', name: 'Smart Home', slug: 'smart-home' },
    stock: 47, sku: 'NC360-WHT', rating: 4.5, reviewCount: 334,
    tags: ['new'], featured: false, isNew: true, isActive: true,
    createdAt: '2024-09-01T00:00:00Z', updatedAt: '2024-09-01T00:00:00Z',
  },
]

export const MOCK_RAFFLES: Raffle[] = [
  {
    id: 'r-1',
    title: 'Win the SonicPro X1 Bundle',
    description: 'Enter for a chance to win our flagship headphones + accessories worth $600. Only 500 tickets available.',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
    prize: 'SonicPro X1 + Full Accessory Bundle',
    prizeValue: 600, ticketPrice: 5, maxTickets: 500, soldTickets: 342,
    status: 'active',
    drawDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: '2024-07-01T00:00:00Z', updatedAt: '2024-07-01T00:00:00Z',
  },
  {
    id: 'r-2',
    title: 'AeroCapture 4K Drone Raffle',
    description: 'Win the pro drone kit including extra batteries, filters, and carrying case.',
    image: 'https://images.unsplash.com/photo-1579829366248-204fe8413f31?w=600&q=80',
    prize: 'AeroCapture 4K Drone Kit',
    prizeValue: 1200, ticketPrice: 10, maxTickets: 200, soldTickets: 187,
    status: 'active',
    drawDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: '2024-07-10T00:00:00Z', updatedAt: '2024-07-10T00:00:00Z',
  },
  {
    id: 'r-3',
    title: 'VisionWatch Pro 5 Giveaway',
    description: 'The premium smartwatch that does it all. One lucky winner takes home this $699 flagship watch.',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80',
    prize: 'VisionWatch Pro 5 (Titanium)',
    prizeValue: 699, ticketPrice: 8, maxTickets: 300, soldTickets: 89,
    status: 'upcoming',
    drawDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: '2024-08-01T00:00:00Z', updatedAt: '2024-08-01T00:00:00Z',
  },
]

const MOCK_ADDRESS = {
  fullName: 'Alex Johnson', line1: '123 Tech Street', city: 'San Francisco',
  state: 'CA', postalCode: '94102', country: 'US', phone: '+1 555 0100',
}

export const MOCK_ORDERS: Order[] = [
  {
    id: 'o-1', reference: 'VG-20240901-001', userId: 'u-1',
    items: [
      { id: 'oi-1', productId: 'p-1', quantity: 1, unitPrice: 349, totalPrice: 349,
        product: { id: 'p-1', name: 'SonicPro X1 Headphones', slug: 'sonicpro-x1', images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80'], price: 349, sku: 'SPX1-BLK' } },
    ],
    subtotal: 349, shippingCost: 9.99, tax: 31.41, discount: 0, total: 390.40,
    status: 'delivered', paymentStatus: 'paid', paymentMethod: 'card',
    shippingAddress: MOCK_ADDRESS,
    createdAt: '2024-09-01T10:00:00Z', updatedAt: '2024-09-05T14:00:00Z',
  },
  {
    id: 'o-2', reference: 'VG-20241001-002', userId: 'u-1',
    items: [
      { id: 'oi-2', productId: 'p-6', quantity: 1, unitPrice: 229, totalPrice: 229,
        product: { id: 'p-6', name: 'PixelBuds Pro 2', slug: 'pixelbuds-pro-2', images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80'], price: 229, sku: 'PBP2-WHT' } },
    ],
    subtotal: 229, shippingCost: 0, tax: 20.61, discount: 20, total: 229.61,
    status: 'shipped', paymentStatus: 'paid', paymentMethod: 'card',
    shippingAddress: MOCK_ADDRESS, trackingNumber: 'TRK987654321',
    createdAt: '2024-10-01T09:00:00Z', updatedAt: '2024-10-03T11:00:00Z',
  },
  {
    id: 'o-3', reference: 'VG-20241110-003', userId: 'u-1',
    items: [
      { id: 'oi-3', productId: 'p-3', quantity: 1, unitPrice: 899, totalPrice: 899,
        product: { id: 'p-3', name: 'AeroCapture 4K Drone', slug: 'aerocapture-4k', images: ['https://images.unsplash.com/photo-1579829366248-204fe8413f31?w=600&q=80'], price: 899, sku: 'AC4K-GRY' } },
    ],
    subtotal: 899, shippingCost: 0, tax: 80.91, discount: 0, total: 979.91,
    status: 'processing', paymentStatus: 'paid', paymentMethod: 'bank_transfer',
    shippingAddress: MOCK_ADDRESS,
    createdAt: '2024-11-10T14:00:00Z', updatedAt: '2024-11-10T14:00:00Z',
  },
]
