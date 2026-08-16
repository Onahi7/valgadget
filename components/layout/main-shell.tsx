'use client'

import { usePathname } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ChatWidget } from '@/components/chat/chat-widget'
import { AnnouncementBar } from '@/components/layout/announcement-bar'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'

export function MainShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isCheckout = pathname === '/checkout'

  if (isCheckout) {
    return <div className="min-h-screen bg-white">{children}</div>
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBar />
      <Header />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <Footer />
      <MobileBottomNav />
      <ChatWidget />
    </div>
  )
}
