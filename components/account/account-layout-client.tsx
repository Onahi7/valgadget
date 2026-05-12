'use client'

import { AccountSidebar } from '@/components/account/account-sidebar'
import { ProtectedRoute } from '@/components/auth/protected-route'

export function AccountLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-page-reveal">
        <div className="flex flex-col lg:flex-row gap-8">
          <AccountSidebar />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
