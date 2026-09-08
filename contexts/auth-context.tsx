'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { clearToken, isApiError } from '@/lib/api-client'
import { authService, type User } from '@/lib/services/auth.service'

interface AuthContextValue {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<User>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isRole: (role: User['role'] | User['role'][]) => boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function getCachedUser(): User | null {
  if (typeof window === 'undefined') return null

  try {
    const value = JSON.parse(localStorage.getItem('vg_user') ?? 'null') as Partial<User> | null
    if (
      value
      && typeof value.id === 'string'
      && typeof value.email === 'string'
      && typeof value.name === 'string'
      && ['customer', 'affiliate', 'admin'].includes(value.role ?? '')
    ) {
      return value as User
    }
  } catch {
    localStorage.removeItem('vg_user')
  }

  return null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch {
      // Logout remains successful locally even if the session already expired.
    } finally {
      clearToken()
      setUser(null)
    }
  }, [])

  const refreshUser = useCallback(async () => {
    const cachedUser = getCachedUser()
    if (cachedUser) {
      // The signed httpOnly cookie remains the security boundary. The cache only
      // avoids a blank/redirecting UI while a cold database connection wakes up.
      setUser(cachedUser)
      setIsLoading(false)
    }

    try {
      const me = await authService.me()
      setUser(me)
      localStorage.setItem('vg_user', JSON.stringify(me))
    } catch (error) {
      // Only an explicit authentication rejection should discard the session.
      // Timeouts and temporary database/network errors must not log the user out.
      if (isApiError(error) && error.status === 401) {
        clearToken()
        setUser(null)
      } else if (!cachedUser) {
        setUser(null)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  // Listen for 401 globally
  useEffect(() => {
    const handler = () => { void logout() }
    window.addEventListener('vg:unauthorized', handler)
    return () => window.removeEventListener('vg:unauthorized', handler)
  }, [logout])

  const login = useCallback(async (email: string, password: string) => {
    const res = await authService.login({ email, password })
    setUser(res.user)
    localStorage.setItem('vg_user', JSON.stringify(res.user))
    return res.user
  }, [])

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await authService.register({ name, email, password })
    setUser(res.user)
    localStorage.setItem('vg_user', JSON.stringify(res.user))
  }, [])

  const isRole = useCallback(
    (role: User['role'] | User['role'][]) => {
      if (!user) return false
      return Array.isArray(role) ? role.includes(user.role) : user.role === role
    },
    [user]
  )

  return (
    <AuthContext.Provider
      value={{ user, token: null, isLoading, isAuthenticated: !!user, login, register, logout, isRole, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
