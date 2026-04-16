'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import type { User } from '@/lib/services/auth.service'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: User['role'] | User['role'][]
  redirectTo?: string
}

export function ProtectedRoute({
  children,
  requiredRole,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, isRole } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      const returnUrl = encodeURIComponent(pathname)
      router.replace(`${redirectTo}?returnUrl=${returnUrl}`)
      return
    }
    if (requiredRole && !isRole(requiredRole)) {
      router.replace('/unauthorized')
    }
  }, [isAuthenticated, isLoading, isRole, requiredRole, redirectTo, router, pathname])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" aria-label="Loading" />
      </div>
    )
  }

  if (!isAuthenticated) return null
  if (requiredRole && !isRole(requiredRole)) return null

  return <>{children}</>
}
