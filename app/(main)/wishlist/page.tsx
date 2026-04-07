'use client'

import Link from 'next/link'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Empty } from '@/components/ui/empty'
import { ProductCard } from '@/components/ecommerce/product-card'
import { useWishlist } from '@/contexts/wishlist-context'
import type { Product } from '@/lib/services/product.service'

export default function WishlistPage() {
  const { items, count } = useWishlist()

  const products: Product[] = items.map(item => ({
    id: item.id, name: item.name, slug: item.slug,
    description: '', price: item.price, comparePrice: item.comparePrice,
    images: item.images, categoryId: '', stock: item.stock, sku: item.sku,
    rating: 0, reviewCount: 0, tags: [], featured: false, isNew: false, isActive: true,
    createdAt: '', updatedAt: '',
  }))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-page-reveal">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Heart className="w-6 h-6 text-primary" /> Wishlist
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">{count} saved item{count !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {count === 0 ? (
        <Empty
          title="Your wishlist is empty"
          description="Save items you love and come back to them anytime."
          action={<Button asChild><Link href="/shop">Browse Products</Link></Button>}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  )
}
