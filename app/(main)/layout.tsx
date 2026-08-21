import { Providers } from '@/components/providers'
import { MainShell } from '@/components/layout/main-shell'
import Link from 'next/link'
import { Wrench } from 'lucide-react'
import { getStoreSettings } from '@/lib/server/store-settings'
import { settingIsTrue } from '@/lib/store-settings'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const settings = await getStoreSettings().catch(() => null)
  if (settings && settingIsTrue(settings, 'maintenanceMode')) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/50 sm:p-12">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-50 text-primary">
            <Wrench className="h-6 w-6" />
          </span>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-950">We’ll be right back</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {settings.storeName} is undergoing a short maintenance update. Please check back soon or contact us if you need help with an existing order.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <a href={`mailto:${settings.storeEmail}`} className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-white">Email support</a>
            <Link href="/admin" className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 px-5 text-sm font-semibold text-slate-700">Admin sign in</Link>
          </div>
        </div>
      </main>
    )
  }
  return (
    <Providers>
      <MainShell>{children}</MainShell>
    </Providers>
  )
}
