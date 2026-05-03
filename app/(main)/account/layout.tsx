import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Account',
  description: 'Manage your Val Gadgets account, orders, and profile settings.',
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children
}
