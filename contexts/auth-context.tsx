'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { getToken, setToken, clearToken } from '@/lib/api-client'
import { authService, type User } from '@/lib/services/auth.service'

interface AuthContextValue {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  isRole: (role: User['role'] | User['role'][]) => boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setTokenState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const logout = useCallback(() => {
    clearToken()
    setUser(null)
    setTokenState(null)
  }, [])

  const refreshUser = useCallback(async () => {
    const stored = getToken()
    if (!stored) { setIsLoading(false); return }
    try {
      const me = await authService.me()
      setUser(me)
      setTokenState(stored)
    } catch {
      logout()
    } finally {
      setIsLoading(false)
    }
  }, [logout])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  // Listen for 401 globally
  useEffect(() => {
    const handler = () => logout()
    window.addEventListener('vg:unauthorized', handler)
    return () => window.removeEventListener('vg:unauthorized', handler)
  }, [logout])

  const login = useCallback(async (email: string, password: string) => {
    const res = await authService.login({ email, password })
    setToken(res.token)
    setTokenState(res.token)
    setUser(res.user)
    // Persist user for quick hydration
    localStorage.setItem('vg_user', JSON.stringify(res.user))
  }, [])

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await authService.register({ name, email, password })
    setToken(res.token)
    setTokenState(res.token)
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
      value={{ user, token, isLoading, isAuthenticated: !!user, login, register, logout, isRole, refreshUser }}
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
