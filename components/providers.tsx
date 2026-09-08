'use client'

import { AuthProvider } from '@/contexts/auth-context'
import { CartProvider } from '@/contexts/cart-context'
import { CartDrawerProvider, useCartDrawer } from '@/contexts/cart-drawer-context'
import { WishlistProvider } from '@/contexts/wishlist-context'
import { CartDrawer } from '@/components/ecommerce/cart-drawer'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <CartDrawerProvider>
          <WishlistProvider>
            {children}
            <CartDrawerHost />
          </WishlistProvider>
        </CartDrawerProvider>
      </CartProvider>
    </AuthProvider>
  )
}

function CartDrawerHost() {
  const { open, setOpen } = useCartDrawer()
  return <CartDrawer open={open} onOpenChange={setOpen} />
}
