import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Wishlist',
  description: 'Your saved products. Come back to your favourite gadgets anytime.',
}

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return children
}
