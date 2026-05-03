import type { Metadata } from 'next'
import { AdminDashboardClient } from '@/components/admin/admin-dashboard-client'

export const metadata: Metadata = { title: 'Dashboard' }

export default function AdminDashboardPage() {
  return <AdminDashboardClient />
}
