'use client'

import Link from 'next/link'
import { ShieldX, ArrowLeft, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6 animate-page-reveal">
        <div className="mx-auto w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
          <ShieldX className="w-10 h-10 text-red-600 dark:text-red-400" />
        </div>

        <div>
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground mt-2">
            You don&apos;t have permission to view this page. If you believe this is an error, try signing in with a different account.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" asChild>
            <Link href="/"><ArrowLeft className="w-4 h-4 mr-2" /> Go Home</Link>
          </Button>
          <Button asChild>
            <Link href="/login"><LogIn className="w-4 h-4 mr-2" /> Sign In</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
