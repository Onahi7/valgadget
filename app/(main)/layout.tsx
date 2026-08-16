import { Providers } from '@/components/providers'
import { MainShell } from '@/components/layout/main-shell'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <MainShell>{children}</MainShell>
    </Providers>
  )
}
