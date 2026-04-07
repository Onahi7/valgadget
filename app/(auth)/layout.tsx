import Link from 'next/link'
import { Zap } from 'lucide-react'
import { Providers } from '@/components/providers'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="min-h-screen flex flex-col bg-background">
        <header className="px-6 py-4">
          <Link href="/" className="inline-flex items-center gap-1.5 font-mono font-bold text-xl tracking-tight">
            <span className="text-primary">VAL</span>
            <span className="text-foreground">GADGET</span>
            <Zap className="w-4 h-4 text-primary" aria-hidden />
          </Link>
        </header>
        <main className="flex-1 flex items-center justify-center px-4 py-8">
          {children}
        </main>
        <footer className="px-6 py-4 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} ValGadget. All rights reserved.
        </footer>
      </div>
    </Providers>
  )
}
