'use client'

import { useEffect, use, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight, Heart, Minus, Plus, ShoppingCart, Star, Truck, RotateCcw, Shield, Share2, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { PriceTag } from '@/components/ecommerce/price-tag'
import { ProductGrid } from '@/components/ecommerce/product-grid'
import { VariantSelector, type ProductVariant } from '@/components/ecommerce/variant-selector'
import { ReviewForm } from '@/components/ecommerce/review-form'
import { ReviewList, StarRating, type Review } from '@/components/ecommerce/review-list'
import { useCart } from '@/contexts/cart-context'
import { useWishlist } from '@/contexts/wishlist-context'
import { useAuth } from '@/contexts/auth-context'
import { productService, type Product } from '@/lib/services/product.service'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { ApiError } from '@/lib/api-client'
export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [product, setProduct] = useState<Product | null>(null)
  const [related, setRelated] = useState<Product[]>([])
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showReviewForm, setShowReviewForm] = useState(false)

  const { addToCart } = useCart()
  const { toggle, has } = useWishlist()
  const { user } = useAuth()
  const [qty, setQty] = useState(1)
  const [activeImg, setActiveImg] = useState(0)

  useEffect(() => {
    let mounted = true

    async function loadProduct() {
      setIsLoading(true)
      setLoadError(null)

      try {
        const found = await productService.getBySlug(slug)
        if (!mounted) return

        setProduct(found)

        // Load variants
        try {
          const res = await fetch(`/api/products/${found.id}/variants`)
          const data = await res.json()
          if (data.data && mounted) {
            setVariants(data.data)
          }
        } catch {
          setVariants([])
        }

        // Load reviews
        try {
          const res = await fetch(`/api/reviews?productId=${found.id}`)
          const data = await res.json()
          if (data.data && mounted) {
            setReviews(data.data)
          }
        } catch {
          setReviews([])
        }

        // Load related products
        try {
          const rel = await productService.getRelated(found.id, 4)
          if (!mounted) return
          setRelated(rel)
        } catch {
          setRelated([])
        }
      } catch (err) {
        if (!mounted) return
        const apiError = err as { message?: string }
        setLoadError(apiError.message ?? 'Unable to load this product right now.')
        setProduct(null)
        setRelated([])
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    loadProduct()

    return () => {
      mounted = false
    }
  }, [slug])

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-muted-foreground mt-4">Loading product details...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
        <p className="text-muted-foreground mb-6">{loadError ?? 'This product does not exist or has been removed.'}</p>
        <Button asChild><Link href="/shop">Back to Shop</Link></Button>
      </div>
    )
  }

  const isWishlisted = has(product.id)

  const handleAddToCart = () => {
    addToCart({ id: product.id, name: product.name, slug: product.slug, images: product.images, price: product.price, stock: product.stock, sku: product.sku }, qty)
    toast.success('Added to cart', { description: `${product.name} ×${qty}` })
  }

  const handleWishlist = () => {
    toggle({ id: product.id, name: product.name, slug: product.slug, images: product.images, price: product.price, comparePrice: product.comparePrice, stock: product.stock, sku: product.sku })
    toast(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-page-reveal">
      {loadError && (
        <div className="mb-6 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {loadError}
        </div>
      )}

      {/* Breadcrumb */}
      <Breadcrumbs 
        className="mb-8"
        items={[
          { label: 'Shop', href: '/shop' },
          ...(product.category ? [{ label: product.category.name, href: `/categories/${product.category.slug}` }] : []),
          { label: product.name }
        ]}
      />

      {/* Main grid */}
      <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
        {/* Images */}
        <div className="flex flex-col gap-3">
          <div className="relative aspect-square rounded-xl overflow-hidden bg-surface">
            <Image
              src={product.images[activeImg] ?? product.images[0]}
              alt={product.name}
              fill
              className="object-cover"
              priority
              unoptimized
            />
            {product.stock === 0 && (
              <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                <Badge variant="outline" className="text-sm font-bold px-4 py-1.5">Sold Out</Badge>
              </div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={cn(
                    'w-16 h-16 rounded-md overflow-hidden border-2 transition-all',
                    i === activeImg ? 'border-primary' : 'border-transparent hover:border-border'
                  )}
                  aria-label={`View image ${i + 1}`}
                >
                  <Image src={img} alt="" width={64} height={64} className="object-cover w-full h-full" unoptimized />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col gap-5">
          {product.category && (
            <Link href={`/categories/${product.category.slug}`} className="text-xs font-mono uppercase tracking-widest text-primary hover:underline">
              {product.category.name}
            </Link>
          )}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold leading-tight text-balance">{product.name}</h1>
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-0.5" aria-label={`Rating: ${product.rating} out of 5`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={cn('w-4 h-4', i < Math.round(product.rating) ? 'fill-primary text-primary' : 'text-muted-foreground/30')} />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">({product.reviewCount} reviews)</span>
              <span className="text-sm font-medium text-primary">{product.rating.toFixed(1)}</span>
            </div>
          </div>

          <PriceTag price={selectedVariant?.price || product.price} comparePrice={product.comparePrice} size="lg" />

          <p className="text-muted-foreground leading-relaxed">{product.description}</p>

          <Separator />

          {/* Variants */}
          {variants.length > 0 && (
            <>
              <VariantSelector
                variants={variants}
                selectedVariant={selectedVariant}
                onSelect={setSelectedVariant}
                basePrice={product.price}
              />
              <Separator />
            </>
          )}

          {/* Quantity + Add to cart */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Qty:</label>
              <div className="flex items-center border border-border rounded-md overflow-hidden">
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                  className="px-3 py-2.5 hover:bg-accent transition-colors disabled:opacity-40"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-4 py-2 text-sm font-medium tabular-nums min-w-12 text-center">{qty}</span>
                <button
                  onClick={() => setQty(q => Math.min((selectedVariant?.stock || product.stock), q + 1))}
                  disabled={qty >= (selectedVariant?.stock || product.stock)}
                  className="px-3 py-2.5 hover:bg-accent transition-colors disabled:opacity-40"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-xs text-muted-foreground">
                {selectedVariant 
                  ? `${selectedVariant.stock} in stock` 
                  : product.stock > 0 
                    ? `${product.stock} in stock` 
                    : 'Out of stock'
                }
              </span>
            </div>

            <div className="flex gap-3">
              <Button
                size="lg"
                disabled={(selectedVariant ? selectedVariant.stock : product.stock) === 0}
                onClick={handleAddToCart}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                {(selectedVariant ? selectedVariant.stock : product.stock) === 0 ? 'Out of Stock' : 'Add to Cart'}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleWishlist}
                aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                className={cn(isWishlisted && 'text-destructive border-destructive hover:bg-destructive/5')}
              >
                <Heart className={cn('w-4 h-4', isWishlisted && 'fill-current')} />
              </Button>
              <Button size="lg" variant="outline" aria-label="Share product">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Trust */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { icon: Truck, text: 'Free shipping over ₦99' },
              { icon: RotateCcw, text: '30-day returns' },
              { icon: Shield, text: 'Secure checkout' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex flex-col items-center gap-1.5 p-3 bg-surface rounded-lg text-center">
                <Icon className="w-4 h-4 text-primary" />
                <span className="text-[11px] text-muted-foreground leading-tight">{text}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono">SKU: {product.sku}</span>
            {product.tags.map(t => (
              <Badge key={t} variant="secondary" className="text-[10px] font-mono uppercase">{t}</Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-16">
        <Tabs defaultValue="description">
          <TabsList className="mb-6">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="specs">Specifications</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({product.reviewCount})</TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="text-muted-foreground leading-relaxed">
            <p>{product.description}</p>
            <p className="mt-4">
              Engineered for performance and built to last, this product sets the standard for what modern tech gear should be. 
              Whether you&apos;re a professional or enthusiast, you&apos;ll feel the difference.
            </p>
          </TabsContent>
          <TabsContent value="specs">
            <div className="grid sm:grid-cols-2 gap-px bg-border rounded-lg overflow-hidden text-sm">
              {[['SKU', product.sku], ['Category', product.category?.name ?? '—'], ['Rating', `${product.rating}/5`], ['Reviews', product.reviewCount], ['In Stock', product.stock]].map(([k, v]) => (
                <div key={String(k)} className="bg-card flex gap-4 px-4 py-3">
                  <span className="text-muted-foreground w-28 shrink-0">{k}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="reviews">
            <div className="space-y-8">
              {/* Rating Summary */}
              <div className="flex items-center gap-8 bg-card border rounded-xl p-6">
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2">{product.rating.toFixed(1)}</div>
                  <StarRating rating={product.rating} showCount count={product.reviewCount} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-4">
                    Based on {product.reviewCount} review{product.reviewCount !== 1 ? 's' : ''}
                  </p>
                  {user ? (
                    <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
                      <DialogTrigger asChild>
                        <Button>
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Write a Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Write a Review</DialogTitle>
                        </DialogHeader>
                        <ReviewForm
                          productId={product.id}
                          onSuccess={() => {
                            setShowReviewForm(false)
                            // Reload reviews
                            fetch(`/api/reviews?productId=${product.id}`)
                              .then(res => res.json())
                              .then(data => {
                                if (data.data) setReviews(data.data)
                              })
                          }}
                          onCancel={() => setShowReviewForm(false)}
                        />
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      <Link href={`/login?returnUrl=/products/${slug}`} className="text-primary hover:underline">
                        Sign in
                      </Link>{' '}
                      to write a review
                    </p>
                  )}
                </div>
              </div>

              {/* Reviews List */}
              <ReviewList reviews={reviews} emptyMessage="No reviews yet. Be the first to review this product!" />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="text-xl font-bold mb-6">Related Products</h2>
          <ProductGrid products={related} />
        </div>
      )}
    </div>
  )
}
