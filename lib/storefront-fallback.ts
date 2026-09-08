import type { Product } from '@/lib/services/product.service'

const timestamp = '2026-08-16T18:10:00.000Z'

type FallbackProductInput = Pick<Product, 'id' | 'name' | 'slug' | 'price' | 'images' | 'categoryId' | 'sku' | 'brand'> & {
  comparePrice?: number
  stock?: number
  isNew?: boolean
}

function fallbackProduct(input: FallbackProductInput): Product {
  return {
    description: `${input.name} from Val Gadgets. Quality checked and available for delivery across Nigeria.`,
    shortDescription: 'Quality checked. Nationwide delivery available.',
    specs: [],
    stock: input.stock ?? 8,
    rating: 4.8,
    reviewCount: 0,
    tags: [],
    condition: 'brand-new',
    featured: true,
    isNew: input.isNew ?? true,
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...input,
  }
}

export const FALLBACK_PRODUCTS: Product[] = [
  fallbackProduct({ id: 'fallback-iphone-15-pm', name: 'iPhone 15 Pro Max', slug: 'iphone-15-pro-max', price: 1_060_000, comparePrice: 1_140_000, images: ['/catalog/official/iph15pm.png'], categoryId: 'fallback-iphones', sku: 'IPH-15-PM', brand: 'Apple' }),
  fallbackProduct({ id: 'fallback-soundcore-boom-2', name: 'Soundcore Boom 2', slug: 'soundcore-boom-2', price: 290_000, comparePrice: 320_000, images: ['/catalog/official/spk-sc-boom2.webp'], categoryId: 'fallback-speakers', sku: 'SPK-SC-BOOM2', brand: 'Soundcore' }),
  fallbackProduct({ id: 'fallback-watch-s11', name: 'Apple Watch Series 11 46mm GPS + Cellular', slug: 'apple-watch-series-11-46mm-gps-cellular-space-black-brand-new-sealed', price: 600_000, images: ['/catalog/official/wat-apl-s11-46-cell.png'], categoryId: 'fallback-wearables', sku: 'WAT-APL-S11-46', brand: 'Apple' }),
  fallbackProduct({ id: 'fallback-monitor-hp', name: 'HP Monitor Series 5 527sf 27-inch FHD', slug: 'hp-monitor-series-5-527sf-27-inch-fhd', price: 400_000, comparePrice: 435_000, images: ['/catalog/official/mon-hp-527sf-27.webp'], categoryId: 'fallback-monitors', sku: 'MON-HP-527SF', brand: 'HP' }),
  fallbackProduct({ id: 'fallback-redmi-pad', name: 'Redmi Pad Pro', slug: 'redmi-pad-pro', price: 362_100, images: ['/catalog/official/rdm-padpro.png'], categoryId: 'fallback-tablets', sku: 'RDM-PAD-PRO', brand: 'Redmi' }),
  fallbackProduct({ id: 'fallback-soundcore-boom-plus', name: 'Soundcore Boom 2 Plus', slug: 'soundcore-boom-2-plus', price: 360_000, comparePrice: 390_000, images: ['/catalog/official/spk-sc-boom2-plus.webp'], categoryId: 'fallback-speakers', sku: 'SPK-SC-BOOM2-PLUS', brand: 'Soundcore' }),
  fallbackProduct({ id: 'fallback-iphone-15-pro', name: 'iPhone 15 Pro', slug: 'iphone-15-pro', price: 960_000, comparePrice: 1_020_000, images: ['/catalog/official/iph15pro.png'], categoryId: 'fallback-iphones', sku: 'IPH-15-PRO', brand: 'Apple' }),
]

export const FALLBACK_CATEGORIES = [
  { id: 'fallback-iphones', name: 'iPhones', slug: 'iphones', image: '/catalog/official/iph15pm.png', parentId: null, productCount: 2 },
  { id: 'fallback-tablets', name: 'Tablets', slug: 'tablets', image: '/catalog/official/rdm-padpro.png', parentId: null, productCount: 1 },
  { id: 'fallback-wearables', name: 'Wearables', slug: 'wearables-smart-devices', image: '/catalog/official/wat-apl-s11-46-cell.png', parentId: null, productCount: 1 },
  { id: 'fallback-speakers', name: 'Speakers', slug: 'speakers', image: '/catalog/official/spk-sc-boom2.webp', parentId: null, productCount: 2 },
  { id: 'fallback-monitors', name: 'Monitors', slug: 'monitors', image: '/catalog/official/mon-hp-527sf-27.webp', parentId: null, productCount: 1 },
  { id: 'fallback-laptops', name: 'Laptops', slug: 'laptops', image: null, parentId: null, productCount: 0 },
]
