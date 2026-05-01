import type { Metadata } from 'next'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminHeader } from '@/components/admin/admin-header'
import { AdminGuard } from '@/components/admin/admin-guard'

export const metadata: Metadata = {
  title: { default: 'Admin — ValGadget', template: '%s | Admin ValGadget' },
  description: 'ValGadget store administration panel',
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className="flex h-screen bg-muted/30 overflow-hidden">
        <AdminSidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <AdminHeader />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </AdminGuard>
  )
}
