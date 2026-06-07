'use client'

import React, { createContext, useCallback, useContext, useState } from 'react'

interface CartDrawerContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  openCart: () => void
}

const CartDrawerContext = createContext<CartDrawerContextValue | null>(null)

export function CartDrawerProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const openCart = useCallback(() => setOpen(true), [])

  return (
    <CartDrawerContext.Provider value={{ open, setOpen, openCart }}>
      {children}
    </CartDrawerContext.Provider>
  )
}

export function useCartDrawer() {
  const ctx = useContext(CartDrawerContext)
  if (!ctx) throw new Error('useCartDrawer must be used within CartDrawerProvider')
  return ctx
}
