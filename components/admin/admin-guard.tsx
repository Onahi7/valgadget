'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, isRole } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.replace('/login?returnUrl=' + encodeURIComponent(pathname))
      return
    }
    if (!isRole('admin')) {
      router.replace('/unauthorized')
    }
  }, [isAuthenticated, isLoading, isRole, router, pathname])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/30">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" aria-label="Loading" />
      </div>
    )
  }

  if (!isAuthenticated || !isRole('admin')) return null

  return <>{children}</>
}
