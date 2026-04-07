import Link from 'next/link'
import Image from 'next/image'
import { Providers } from '@/components/providers'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="min-h-screen flex flex-col bg-background">
        <header className="px-6 py-4">
          <Link href="/" className="inline-flex items-center">
            <Image src="/logo.png" alt="Val Gadgets" width={110} height={44} className="h-10 w-auto object-contain" priority />
          </Link>
        </header>
        <main className="flex-1 flex items-center justify-center px-4 py-8">
          {children}
        </main>
        <footer className="px-6 py-4 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Val Gadgets. All rights reserved.
        </footer>
      </div>
    </Providers>
  )
}
