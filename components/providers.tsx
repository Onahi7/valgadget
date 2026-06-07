'use client'

import { AuthProvider } from '@/contexts/auth-context'
import { CartProvider } from '@/contexts/cart-context'
import { CartDrawerProvider, useCartDrawer } from '@/contexts/cart-drawer-context'
import { WishlistProvider } from '@/contexts/wishlist-context'
import { ThemeProvider } from '@/components/theme-provider'
import { CartDrawer } from '@/components/ecommerce/cart-drawer'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
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
    </ThemeProvider>
  )
}

function CartDrawerHost() {
  const { open, setOpen } = useCartDrawer()
  return <CartDrawer open={open} onOpenChange={setOpen} />
}
