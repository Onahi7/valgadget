'use client'

import { Button } from '@/components/ui/button'

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="text-center space-y-4">
        <h2 className="text-xl font-bold">Something went wrong</h2>
        <p className="text-sm text-muted-foreground max-w-md">{error.message || 'An unexpected error occurred.'}</p>
        <Button onClick={reset} variant="outline">Try again</Button>
      </div>
    </div>
  )
}
