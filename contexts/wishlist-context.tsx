'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { Product } from '@/lib/services/product.service'

type WishlistProduct = Pick<Product, 'id' | 'name' | 'slug' | 'images' | 'price' | 'comparePrice' | 'stock' | 'sku'>

interface WishlistContextValue {
  items: WishlistProduct[]
  add: (product: WishlistProduct) => void
  remove: (productId: string) => void
  toggle: (product: WishlistProduct) => void
  has: (productId: string) => boolean
  count: number
}

const WishlistContext = createContext<WishlistContextValue | null>(null)
const STORAGE_KEY = 'vg_wishlist'

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistProduct[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setItems(JSON.parse(stored))
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const add = useCallback((product: WishlistProduct) => {
    setItems(prev => prev.some(i => i.id === product.id) ? prev : [...prev, product])
  }, [])

  const remove = useCallback((productId: string) => {
    setItems(prev => prev.filter(i => i.id !== productId))
  }, [])

  const toggle = useCallback((product: WishlistProduct) => {
    setItems(prev =>
      prev.some(i => i.id === product.id)
        ? prev.filter(i => i.id !== product.id)
        : [...prev, product]
    )
  }, [])

  const has = useCallback((productId: string) => items.some(i => i.id === productId), [items])

  return (
    <WishlistContext.Provider value={{ items, add, remove, toggle, has, count: items.length }}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider')
  return ctx
}
