import type { Metadata } from 'next'
import { AccountLayoutClient } from '@/components/account/account-layout-client'

export const metadata: Metadata = {
  title: 'My Account',
  description: 'Manage your Val Gadgets account, orders, and profile settings.',
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <AccountLayoutClient>{children}</AccountLayoutClient>
}
