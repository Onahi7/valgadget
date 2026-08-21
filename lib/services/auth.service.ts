import { api } from '@/lib/api-client'

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole = 'customer' | 'affiliate' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  phone?: string
  affiliateCode?: string
  isVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  user: User
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  role?: UserRole
  affiliateCode?: string
}

export interface ForgotPasswordPayload {
  email: string
}

export interface ResetPasswordPayload {
  token: string
  password: string
  passwordConfirmation: string
}

export interface UpdateProfilePayload {
  name?: string
  email?: string
  phone?: string
  avatar?: string
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
  newPasswordConfirmation: string
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const authService = {
  /** Authenticate and receive a JWT */
  login: (payload: LoginPayload) =>
    api.post<AuthResponse>('/auth/login', payload),

  /** Create account and receive a JWT */
  register: (payload: RegisterPayload) =>
    api.post<AuthResponse>('/auth/register', payload),

  /** Invalidate token server-side */
  logout: () =>
    api.post<{ message: string }>('/auth/logout'),

  /** Get the currently authenticated user */
  me: () =>
    api.get<User>('/auth/me'),

  /** Send password-reset email */
  forgotPassword: (payload: ForgotPasswordPayload) =>
    api.post<{ message: string }>('/auth/forgot-password', payload),

  /** Reset password via emailed token */
  resetPassword: (payload: ResetPasswordPayload) =>
    api.post<{ message: string }>('/auth/reset-password', payload),

  /** Update display name / email / phone */
  updateProfile: (payload: UpdateProfilePayload) =>
    api.patch<User>('/auth/profile', payload),

  /** Change password (requires current password) */
  changePassword: (payload: ChangePasswordPayload) =>
    api.post<{ message: string }>('/auth/change-password', payload),

  /** Verify email with token from link */
  verifyEmail: (token: string) =>
    api.post<{ message: string }>('/auth/verify-email', { token }),

  /** Resend verification email */
  resendVerification: (email?: string) =>
    api.post<{ message: string }>('/auth/resend-verification', email ? { email } : {}),

  // ── Admin user management ──────────────────────────────────────────────────

  /** [Admin] List all users */
  getAllUsers: (params?: { page?: number; limit?: number; role?: UserRole; search?: string }) =>
    api.get<{ data: User[]; total: number; page: number; totalPages: number }>('/admin/users', params),

  /** [Admin] Get single user */
  getUserById: (id: string) =>
    api.get<User>(`/admin/users/${id}`),

  /** [Admin] Update any user */
  adminUpdateUser: (id: string, payload: Partial<User>) =>
    api.patch<User>(`/admin/users/${id}`, payload),

  /** [Admin] Delete a user */
  adminDeleteUser: (id: string) =>
    api.delete<{ message: string }>(`/admin/users/${id}`),

  /** [Admin] Change user role */
  adminChangeRole: (id: string, role: UserRole) =>
    api.patch<User>(`/admin/users/${id}`, { role }),
}
