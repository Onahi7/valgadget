import { Providers } from '@/components/providers'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ChatWidget } from '@/components/chat/chat-widget'
import { AnnouncementBar } from '@/components/layout/announcement-bar'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="min-h-screen flex flex-col">
        <AnnouncementBar />
        <Header />
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
        <Footer />
        <MobileBottomNav />
        <ChatWidget />
      </div>
    </Providers>
  )
}
