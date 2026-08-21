'use client'

import { AdminProviders } from '@/components/admin-providers'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminHeader } from '@/components/admin/admin-header'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { usePathname } from 'next/navigation'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (pathname === '/admin/login') {
    return <AdminProviders>{children}</AdminProviders>
  }

  return (
    <AdminProviders>
      <ProtectedRoute requiredRole="admin">
        <div className="flex h-screen overflow-hidden bg-[#f6f7f6]">
          <AdminSidebar />
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <AdminHeader />
            <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
              {children}
            </main>
          </div>
        </div>
      </ProtectedRoute>
    </AdminProviders>
  )
}
