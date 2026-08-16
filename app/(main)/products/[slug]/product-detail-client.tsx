'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, Minus, Plus, ShoppingCart, Star, Truck, RotateCcw, Shield, Share2, MessageSquare } from 'lucide-react'
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
import { ReviewHistogram } from '@/components/ecommerce/review-histogram'
import { FrequentlyBoughtTogether } from '@/components/ecommerce/frequently-bought-together'
import { StickyBuyBar } from '@/components/ecommerce/sticky-buy-bar'
import { useCart } from '@/contexts/cart-context'
import { useWishlist } from '@/contexts/wishlist-context'
import { useAuth } from '@/contexts/auth-context'
import { productService, type Product } from '@/lib/services/product.service'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const conditionLabels = {
  'brand-new': 'Brand New',
  'uk-used': 'UK Used',
  'us-used': 'US Used',
  'naija-used': 'Naija Used',
  refurbished: 'Refurbished',
  'open-box': 'Open Box',
} as const

interface ProductDetailClientProps {
  slug: string
  initialProduct: Product | null
}

export function ProductDetailClient({ slug, initialProduct }: ProductDetailClientProps) {
  const [product, setProduct] = useState<Product | null>(initialProduct)
  const [related, setRelated] = useState<Product[]>([])
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(!initialProduct)
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
      if (!initialProduct) {
        setIsLoading(true)
        setLoadError(null)
      }

      try {
        const found = initialProduct ?? await productService.getBySlug(slug)
        if (!mounted) return

        setProduct(found)

        // Load variants
        try {
          const res = await fetch(`/api/products/${found.id}/variants`)
          const data = await res.json()
          if (!mounted) return
          const list = Array.isArray(data) ? data : data.data
          setVariants(Array.isArray(list) ? list : [])
        } catch {
          setVariants([])
        }

        // Load reviews
        try {
          const res = await productService.getReviews(found.id)
          if (mounted) setReviews(res.data)
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
  }, [slug, initialProduct])

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
  const effectivePrice = selectedVariant?.price ?? product.price
  const effectiveStock = selectedVariant?.stock ?? product.stock
  const effectiveSku = selectedVariant?.sku ?? product.sku
  const activeImage = selectedVariant?.image ?? product.images[activeImg] ?? product.images[0] ?? '/placeholder-product.svg'
  const featureSpecs = (product.specs ?? []).slice(0, 4)
  const detailSpecs = [
    ...(product.specs ?? []),
    { label: 'SKU', value: product.sku },
    { label: 'Category', value: product.category?.name ?? 'Unknown' },
    { label: 'Rating', value: `${product.rating}/5` },
    { label: 'Reviews', value: String(product.reviewCount) },
  ]

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, text: `Check out ${product.name} on ValGadget`, url })
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied to clipboard!')
    }
  }

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: selectedVariant ? `${product.name} - ${selectedVariant.name}` : product.name,
      slug: product.slug,
      images: selectedVariant?.image ? [selectedVariant.image, ...product.images] : product.images,
      price: effectivePrice,
      sku: effectiveSku,
      stock: effectiveStock,
    }, qty)
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
      <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
        {/* Images */}
        <div className="flex min-w-0 flex-col gap-3">
          <div className="relative aspect-square max-h-[min(82vh,680px)] w-full overflow-hidden rounded-xl border border-border bg-white">
            <Image
              src={activeImage}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-contain p-4 sm:p-6"
              priority
              unoptimized
            />
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={cn(
                    'h-16 w-16 shrink-0 rounded-md overflow-hidden border-2 transition-all',
                    i === activeImg ? 'border-primary' : 'border-transparent hover:border-border'
                  )}
                  aria-label={`View image ${i + 1}`}
                >
                  <Image src={img} alt="" width={64} height={64} className="h-full w-full object-contain bg-white p-1" unoptimized />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex min-w-0 flex-col gap-5">
          {product.category && (
            <Link href={`/categories/${product.category.slug}`} className="text-xs font-mono uppercase tracking-widest text-primary hover:underline">
              {product.category.name}
            </Link>
          )}
          <div className="flex flex-wrap gap-2">
            <Badge className="border border-primary/20 bg-primary/10 text-primary hover:bg-primary/10">
              {conditionLabels[product.condition ?? 'brand-new']}
            </Badge>
            {product.brand ? <Badge variant="outline">{product.brand}</Badge> : null}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold leading-tight text-balance break-words">{product.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-0.5" aria-label={`Rating: ${product.rating} out of 5`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={cn('w-4 h-4', i < Math.round(product.rating) ? 'fill-primary text-primary' : 'text-muted-foreground/30')} />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">({product.reviewCount} reviews)</span>
              <span className="text-sm font-medium text-primary">{product.rating.toFixed(1)}</span>
            </div>
          </div>

          <PriceTag price={effectivePrice} comparePrice={product.comparePrice} size="lg" />

          {product.shortDescription && (
            <p className="text-sm md:text-base font-medium text-foreground/90 leading-relaxed">
              {product.shortDescription}
            </p>
          )}

          <p className="break-words text-muted-foreground leading-relaxed">{product.description}</p>

          {featureSpecs.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {featureSpecs.map((spec) => (
                <div key={`${spec.label}-${spec.value}`} className="rounded-lg border border-border bg-card px-3 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{spec.label}</p>
                  <p className="mt-1 break-words text-sm font-medium leading-snug">{spec.value}</p>
                </div>
              ))}
            </div>
          )}

          <Separator />

          {/* Variants */}
          {variants.length > 0 && (
            <>
              <VariantSelector
                variants={variants}
                selectedVariant={selectedVariant}
                onSelect={variant => {
                  setSelectedVariant(variant)
                  setQty(1)
                }}
                basePrice={product.price}
              />
              <Separator />
            </>
          )}

          {/* Quantity + Add to cart */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
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
                  onClick={() => setQty(q => Math.min(effectiveStock, q + 1))}
                  disabled={qty >= effectiveStock}
                  className="px-3 py-2.5 hover:bg-accent transition-colors disabled:opacity-40"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                onClick={handleAddToCart}
                disabled={effectiveStock <= 0}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                {effectiveStock > 0 ? 'Add to Cart' : 'Out of Stock'}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleWishlist}
                aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                className={cn('sm:flex-none', isWishlisted && 'text-destructive border-destructive hover:bg-destructive/5')}
              >
                <Heart className={cn('w-4 h-4', isWishlisted && 'fill-current')} />
              </Button>
              <Button size="lg" variant="outline" aria-label="Share product" className="sm:flex-none" onClick={handleShare}>
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Trust */}
          <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-3">
            {[
              { icon: Truck, text: 'Free shipping over ₦500k' },
              { icon: RotateCcw, text: '30-day returns' },
              { icon: Shield, text: 'Secure checkout' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 rounded-lg bg-surface p-3 text-left sm:flex-col sm:items-center sm:gap-1.5 sm:text-center">
                <Icon className="w-4 h-4 text-primary" />
                <span className="text-[11px] text-muted-foreground leading-tight">{text}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono">SKU: {effectiveSku}</span>
            {product.tags.map(t => (
              <Badge key={t} variant="secondary" className="text-[10px] font-mono uppercase">{t}</Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-16">
        <Tabs defaultValue="description">
          <TabsList className="mb-6 grid h-auto grid-cols-1 gap-2 bg-transparent p-0 sm:inline-flex sm:h-10 sm:grid-cols-none">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="specs">Specifications</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({product.reviewCount})</TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="break-words text-muted-foreground leading-relaxed">
            <p>{product.description}</p>
            {product.shortDescription && <p className="mt-4">{product.shortDescription}</p>}
          </TabsContent>
          <TabsContent value="specs">
            <div className="grid sm:grid-cols-2 gap-px bg-border rounded-lg overflow-hidden text-sm">
              {detailSpecs.map(({ label, value }) => (
                <div key={`${label}-${value}`} className="bg-card flex min-w-0 flex-col gap-1 px-4 py-3 sm:flex-row sm:gap-4">
                  <span className="text-muted-foreground shrink-0 sm:w-28">{label}</span>
                  <span className="break-words font-medium">{value}</span>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="reviews">
            <div className="space-y-8">
              {/* Rating Histogram */}
              {product.reviewCount > 0 ? (
                <ReviewHistogram
                  summary={{
                    average: product.rating,
                    count: product.reviewCount,
                    distribution: reviews.reduce<Record<1 | 2 | 3 | 4 | 5, number>>(
                      (acc, r) => {
                        const star = Math.max(1, Math.min(5, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5
                        acc[star] = (acc[star] ?? 0) + 1
                        return acc
                      },
                      { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
                    ),
                  }}
                />
              ) : null}

              {/* Write Review CTA */}
              <div className="flex flex-col gap-2 rounded-xl border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  {user
                    ? 'Have you bought this product? Share your experience with other customers.'
                    : 'Sign in to write a review.'}
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
                          productService.getReviews(product.id)
                            .then(res => setReviews(res.data))
                            .catch(() => setReviews([]))
                        }}
                        onCancel={() => setShowReviewForm(false)}
                      />
                    </DialogContent>
                  </Dialog>
                ) : (
                  <Button asChild>
                    <Link href={`/login?returnUrl=/products/${slug}`}>Sign in to review</Link>
                  </Button>
                )}
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

      {/* Frequently Bought Together */}
      {product && related.length > 0 ? (
        <FrequentlyBoughtTogether main={product} related={related} />
      ) : null}

      {/* Sticky mobile buy bar */}
      {product ? <StickyBuyBar product={product} /> : null}
    </div>
  )
}
