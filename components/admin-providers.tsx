'use client'

import { AuthProvider } from '@/contexts/auth-context'
import { AdminConfirmProvider } from '@/components/admin/admin-confirm-provider'

/**
 * Minimal providers for the admin dashboard.
 * Only includes theme + auth — no cart, wishlist, or chat widget.
 */
export function AdminProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminConfirmProvider>{children}</AdminConfirmProvider>
    </AuthProvider>
  )
}
