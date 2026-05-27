import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="px-6 py-4 flex items-center justify-between border-b border-border/50">
        <Link href="/" className="inline-flex items-center">
          <Image src="/logo.png" alt="Val Gadgets" width={160} height={56} className="h-12 w-auto object-contain" priority />
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to store
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        {children}
      </main>
      <footer className="px-6 py-4 text-center text-xs text-muted-foreground border-t border-border/50">
        &copy; {new Date().getFullYear()} Val Gadgets. All rights reserved.
        {' | '}
        <Link href="/legal/terms" className="hover:text-foreground transition-colors">Terms</Link>
        {' | '}
        <Link href="/legal/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
      </footer>
    </div>
  )
}
