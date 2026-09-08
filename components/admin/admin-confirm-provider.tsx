'use client'

import * as React from 'react'
import { AlertTriangle } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

type ConfirmOptions = {
  title: string
  description: string
  confirmLabel?: string
  tone?: 'default' | 'destructive'
}

type PendingConfirmation = ConfirmOptions & {
  resolve: (confirmed: boolean) => void
}

const AdminConfirmContext = React.createContext<((options: ConfirmOptions) => Promise<boolean>) | null>(null)

export function AdminConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = React.useState<PendingConfirmation | null>(null)
  const pendingRef = React.useRef<PendingConfirmation | null>(null)

  const confirm = React.useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>(resolve => {
      const next = { ...options, resolve }
      pendingRef.current = next
      setPending(next)
    })
  }, [])

  const finish = React.useCallback((confirmed: boolean) => {
    const current = pendingRef.current
    pendingRef.current = null
    setPending(null)
    current?.resolve(confirmed)
  }, [])

  return (
    <AdminConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog open={Boolean(pending)} onOpenChange={open => { if (!open) finish(false) }}>
        <AlertDialogContent className="max-w-md rounded-xl p-0">
          <div className="flex gap-4 p-6">
            <div className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-full',
              pending?.tone === 'destructive'
                ? 'bg-destructive/10 text-destructive'
                : 'bg-primary/10 text-primary',
            )}>
              <AlertTriangle className="size-5" aria-hidden="true" />
            </div>
            <AlertDialogHeader className="gap-1.5 text-left">
              <AlertDialogTitle>{pending?.title}</AlertDialogTitle>
              <AlertDialogDescription className="leading-6">
                {pending?.description}
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <AlertDialogFooter className="border-t bg-muted/30 px-6 py-4 sm:justify-end">
            <AlertDialogCancel onClick={() => finish(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => finish(true)}
              className={cn(pending?.tone === 'destructive' && 'bg-destructive text-white hover:bg-destructive/90')}
            >
              {pending?.confirmLabel ?? 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminConfirmContext.Provider>
  )
}

export function useAdminConfirm() {
  const context = React.useContext(AdminConfirmContext)
  if (!context) throw new Error('useAdminConfirm must be used inside AdminConfirmProvider')
  return context
}
