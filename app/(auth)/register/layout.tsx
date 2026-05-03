import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Create your Val Gadgets account. Shop gadgets, enter raffles, and track your orders.',
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children
}
