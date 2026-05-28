'use client'

import React, { createContext, useCallback, useContext, useEffect, useReducer } from 'react'
import type { Product } from '@/lib/services/product.service'

export interface CartItem {
  product: Pick<Product, 'id' | 'name' | 'slug' | 'images' | 'price' | 'sku' | 'stock'>
  quantity: number
}

interface CartState {
  items: CartItem[]
  couponCode: string | null
  couponDiscount: number
}

type CartAction =
  | { type: 'ADD'; product: CartItem['product']; quantity?: number }
  | { type: 'REMOVE'; productId: string }
  | { type: 'UPDATE_QTY'; productId: string; quantity: number }
  | { type: 'APPLY_COUPON'; code: string; discount: number }
  | { type: 'REMOVE_COUPON' }
  | { type: 'CLEAR' }
  | { type: 'HYDRATE'; state: CartState }

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD': {
      const qty = action.quantity ?? 1
      const existing = state.items.find(i => i.product.id === action.product.id)
      if (existing) {
        return {
          ...state,
          items: state.items.map(i =>
            i.product.id === action.product.id
              ? { ...i, quantity: i.quantity + qty }
              : i
          ),
        }
      }
      return { ...state, items: [...state.items, { product: action.product, quantity: qty }] }
    }
    case 'REMOVE':
      return { ...state, items: state.items.filter(i => i.product.id !== action.productId) }
    case 'UPDATE_QTY':
      if (action.quantity <= 0) {
        return { ...state, items: state.items.filter(i => i.product.id !== action.productId) }
      }
      return {
        ...state,
        items: state.items.map(i =>
          i.product.id === action.productId
            ? { ...i, quantity: action.quantity }
            : i
        ),
      }
    case 'APPLY_COUPON':
      return { ...state, couponCode: action.code, couponDiscount: action.discount }
    case 'REMOVE_COUPON':
      return { ...state, couponCode: null, couponDiscount: 0 }
    case 'CLEAR':
      return { items: [], couponCode: null, couponDiscount: 0 }
    case 'HYDRATE':
      return action.state
    default:
      return state
  }
}

interface CartContextValue extends CartState {
  addToCart: (product: CartItem['product'], quantity?: number) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  applyCoupon: (code: string, discount: number) => void
  removeCoupon: () => void
  clearCart: () => void
  itemCount: number
  subtotal: number
  discount: number
  total: number
}

const CartContext = createContext<CartContextValue | null>(null)
const STORAGE_KEY = 'vg_cart'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], couponCode: null, couponDiscount: 0 })

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) dispatch({ type: 'HYDRATE', state: JSON.parse(stored) })
    } catch { /* ignore */ }
  }, [])

  // Persist on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const addToCart = useCallback((product: CartItem['product'], quantity = 1) => {
    dispatch({ type: 'ADD', product, quantity })
  }, [])

  const removeFromCart = useCallback((productId: string) => {
    dispatch({ type: 'REMOVE', productId })
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QTY', productId, quantity })
  }, [])

  const applyCoupon = useCallback((code: string, discount: number) => {
    dispatch({ type: 'APPLY_COUPON', code, discount })
  }, [])

  const removeCoupon = useCallback(() => dispatch({ type: 'REMOVE_COUPON' }), [])
  const clearCart = useCallback(() => dispatch({ type: 'CLEAR' }), [])

  const itemCount = state.items.reduce((s, i) => s + i.quantity, 0)
  const subtotal = state.items.reduce((s, i) => s + i.product.price * i.quantity, 0)
  const discount = state.couponDiscount
  const total = Math.max(0, subtotal - discount)

  return (
    <CartContext.Provider value={{ ...state, addToCart, removeFromCart, updateQuantity, applyCoupon, removeCoupon, clearCart, itemCount, subtotal, discount, total }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
