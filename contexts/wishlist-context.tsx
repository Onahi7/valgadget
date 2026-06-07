'use client'

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { wishlistService, type WishlistItem } from '@/lib/services/wishlist.service'
import type { Product } from '@/lib/services/product.service'

type WishlistProduct = Pick<Product, 'id' | 'name' | 'slug' | 'images' | 'price' | 'comparePrice' | 'stock' | 'sku'>

interface WishlistContextValue {
  items: WishlistProduct[]
  add: (product: WishlistProduct) => void
  remove: (productId: string) => void
  toggle: (product: WishlistProduct) => void
  has: (productId: string) => boolean
  count: number
  isLoading: boolean
  hydrated: boolean
}

const WishlistContext = createContext<WishlistContextValue | null>(null)
const STORAGE_KEY = 'vg_wishlist'

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const [items, setItems] = useState<WishlistProduct[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const syncedRef = useRef(false)

  // Load wishlist: from API if authenticated, from localStorage if guest
  useEffect(() => {
    if (isAuthenticated && user) {
      setIsLoading(true)
      wishlistService.getAll()
        .then((data: WishlistItem[]) => {
          const products: WishlistProduct[] = data.map(item => ({
            id: item.product.id,
            name: item.product.name,
            slug: item.product.slug,
            images: item.product.images,
            price: item.product.price,
            comparePrice: item.product.comparePrice,
            stock: item.product.stock,
            sku: item.product.sku,
          }))
          setItems(products)

          // Sync any localStorage items to server on first login
          if (!syncedRef.current) {
            syncedRef.current = true
            try {
              const stored = localStorage.getItem(STORAGE_KEY)
              if (stored) {
                const localItems: WishlistProduct[] = JSON.parse(stored)
                const serverIds = new Set(products.map(p => p.id))
                const toSync = localItems.filter(p => !serverIds.has(p.id))
                if (toSync.length > 0) {
                  Promise.all(toSync.map(p => wishlistService.add(p.id).catch(() => {})))
                    .then(() => wishlistService.getAll())
                    .then((refreshed: WishlistItem[]) => {
                      setItems(refreshed.map(item => ({
                        id: item.product.id,
                        name: item.product.name,
                        slug: item.product.slug,
                        images: item.product.images,
                        price: item.product.price,
                        comparePrice: item.product.comparePrice,
                        stock: item.product.stock,
                        sku: item.product.sku,
                      })))
                    })
                    .catch(() => {})
                }
                localStorage.removeItem(STORAGE_KEY)
              }
            } catch { /* ignore */ }
          }
        })
        .catch(() => {
          // Fallback to localStorage if API fails
          try {
            const stored = localStorage.getItem(STORAGE_KEY)
            if (stored) setItems(JSON.parse(stored))
          } catch { /* ignore */ }
        })
        .finally(() => {
          setIsLoading(false)
          setHydrated(true)
        })
    } else {
      // Guest: use localStorage
      syncedRef.current = false
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) setItems(JSON.parse(stored))
        else setItems([])
      } catch {
        setItems([])
      }
      setHydrated(true)
    }
  }, [isAuthenticated, user])

  // Persist to localStorage for guests
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    }
  }, [items, isAuthenticated])

  const add = useCallback((product: WishlistProduct) => {
    setItems(prev => prev.some(i => i.id === product.id) ? prev : [...prev, product])
    if (isAuthenticated) {
      wishlistService.add(product.id).catch(() => {})
    }
  }, [isAuthenticated])

  const remove = useCallback((productId: string) => {
    setItems(prev => prev.filter(i => i.id !== productId))
    if (isAuthenticated) {
      wishlistService.remove(productId).catch(() => {})
    }
  }, [isAuthenticated])

  const toggle = useCallback((product: WishlistProduct) => {
    const exists = items.some(i => i.id === product.id)
    if (exists) {
      setItems(prev => prev.filter(i => i.id !== product.id))
      if (isAuthenticated) {
        wishlistService.remove(product.id).catch(() => {})
      }
    } else {
      setItems(prev => [...prev, product])
      if (isAuthenticated) {
        wishlistService.add(product.id).catch(() => {})
      }
    }
  }, [items, isAuthenticated])

  const has = useCallback((productId: string) => items.some(i => i.id === productId), [items])

  return (
    <WishlistContext.Provider value={{ items, add, remove, toggle, has, count: items.length, isLoading, hydrated }}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider')
  return ctx
}
