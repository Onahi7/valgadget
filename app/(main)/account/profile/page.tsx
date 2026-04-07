'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Lock, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { useAuth } from '@/contexts/auth-context'
import { authService } from '@/lib/services/auth.service'
import { toast } from 'sonner'
import type { ApiError } from '@/lib/api-client'

const profileSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'Required'),
  newPassword: z.string().min(8, 'At least 8 characters'),
  newPasswordConfirmation: z.string(),
}).refine(d => d.newPassword === d.newPasswordConfirmation, {
  message: 'Passwords do not match',
  path: ['newPasswordConfirmation'],
})

type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const [profileError, setProfileError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '', email: user?.email ?? '', phone: user?.phone ?? '' },
  })

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  const onProfileSubmit = async (data: ProfileForm) => {
    setProfileError(null)
    try {
      await authService.updateProfile(data)
      await refreshUser()
      toast.success('Profile updated')
    } catch (err) {
      setProfileError((err as ApiError).message ?? 'Update failed')
    }
  }

  const onPasswordSubmit = async (data: PasswordForm) => {
    setPasswordError(null)
    try {
      await authService.changePassword(data)
      passwordForm.reset()
      toast.success('Password changed successfully')
    } catch (err) {
      setPasswordError((err as ApiError).message ?? 'Password change failed')
    }
  }

  return (
    <ProtectedRoute>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 animate-page-reveal space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your account information and password</p>
        </div>

        {/* Profile info */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-bold text-base flex items-center gap-2 mb-5">
            <User className="w-4 h-4 text-primary" /> Personal Information
          </h2>
          {profileError && <Alert variant="destructive" className="mb-4"><AlertDescription>{profileError}</AlertDescription></Alert>}
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="flex flex-col gap-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" {...profileForm.register('name')} />
                {profileForm.formState.errors.name && <p className="text-destructive text-xs">{profileForm.formState.errors.name.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input id="phone" type="tel" {...profileForm.register('phone')} placeholder="+1 555 0100" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" {...profileForm.register('email')} />
              {profileForm.formState.errors.email && <p className="text-destructive text-xs">{profileForm.formState.errors.email.message}</p>}
            </div>
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium capitalize">{user?.role}</div>
              {user?.affiliateCode && (
                <div className="px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-xs font-mono">
                  Affiliate: {user.affiliateCode}
                </div>
              )}
            </div>
            <Button type="submit" disabled={profileForm.formState.isSubmitting} className="self-start bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
              <Save className="w-4 h-4" />
              {profileForm.formState.isSubmitting ? 'Saving…' : 'Save Changes'}
            </Button>
          </form>
        </div>

        <Separator />

        {/* Password */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-bold text-base flex items-center gap-2 mb-5">
            <Lock className="w-4 h-4 text-primary" /> Change Password
          </h2>
          {passwordError && <Alert variant="destructive" className="mb-4"><AlertDescription>{passwordError}</AlertDescription></Alert>}
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input id="currentPassword" type="password" {...passwordForm.register('currentPassword')} />
              {passwordForm.formState.errors.currentPassword && <p className="text-destructive text-xs">{passwordForm.formState.errors.currentPassword.message}</p>}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" {...passwordForm.register('newPassword')} />
                {passwordForm.formState.errors.newPassword && <p className="text-destructive text-xs">{passwordForm.formState.errors.newPassword.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirm">Confirm New Password</Label>
                <Input id="confirm" type="password" {...passwordForm.register('newPasswordConfirmation')} />
                {passwordForm.formState.errors.newPasswordConfirmation && <p className="text-destructive text-xs">{passwordForm.formState.errors.newPasswordConfirmation.message}</p>}
              </div>
            </div>
            <Button type="submit" disabled={passwordForm.formState.isSubmitting} className="self-start bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
              <Lock className="w-4 h-4" />
              {passwordForm.formState.isSubmitting ? 'Updating…' : 'Update Password'}
            </Button>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  )
}
