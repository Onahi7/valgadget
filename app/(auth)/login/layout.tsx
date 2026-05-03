import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your Val Gadgets account to manage orders, wishlists, and more.',
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
