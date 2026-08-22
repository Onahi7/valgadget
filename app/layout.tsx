import type { Metadata, Viewport } from 'next'
import { Inter, Space_Grotesk, Space_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'
import { getStoreSettings } from '@/lib/server/store-settings'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
  display: 'swap',
})

const defaultMetadata: Metadata = {
  title: {
    default: 'Val Gadgets — Your #1 Gadget Plug in Nigeria',
    template: '%s | Val Gadgets',
  },
  description:
    'Your number 1 gadget plug in Nigeria. Shop phones, laptops, power banks, solar inverters, earbuds & accessories. Nationwide delivery. Solution to every gadget need.',
  keywords: [
    'gadgets Nigeria', 'buy phones Nigeria', 'laptops Nigeria', 'power bank Nigeria',
    'solar inverter Nigeria', 'Val Gadgets', 'earbuds Nigeria', 'Samsung Nigeria',
    'HP EliteBook Nigeria', 'EcoFlow Nigeria', 'smart watch Nigeria', 'Anker Nigeria',
    'buy gadgets online Nigeria', 'nationwide delivery gadgets', 'tech accessories Nigeria',
    'gadget plug Nigeria', 'affordable gadgets', 'refurbished laptops Nigeria',
  ],
  authors: [{ name: 'Val Gadgets' }],
  creator: 'Val Gadgets',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://valgadgets.com'),
  openGraph: {
    title: 'Val Gadgets — Your #1 Gadget Plug in Nigeria',
    description: 'Shop phones, laptops, power banks, solar inverters & accessories. Nationwide delivery. Solution to every gadget need.',
    type: 'website',
    locale: 'en_NG',
    siteName: 'Val Gadgets',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Val Gadgets — Next-Level Tech Gear',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@Val_Gadget',
    creator: '@Val_Gadget',
    title: 'Val Gadgets — Your #1 Gadget Plug in Nigeria',
    description: 'Shop phones, laptops, power banks, solar inverters & accessories. Nationwide delivery. Solution to every gadget need.',
    images: ['/twitter-image.png'],
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'manifest', url: '/site.webmanifest' },
    ],
  },
  generator: 'Next.js',
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await getStoreSettings()
    const keywords = settings.seoKeywords.split(',').map(keyword => keyword.trim()).filter(Boolean)
    return {
      ...defaultMetadata,
      title: { default: settings.seoTitle, template: `%s | ${settings.storeName}` },
      description: settings.seoDescription,
      keywords,
      authors: [{ name: settings.storeName }],
      creator: settings.storeName,
      openGraph: {
        ...defaultMetadata.openGraph,
        title: settings.seoTitle,
        description: settings.seoDescription,
        siteName: settings.storeName,
      },
      twitter: {
        ...defaultMetadata.twitter,
        title: settings.seoTitle,
        description: settings.seoDescription,
      },
    }
  } catch (error) {
    console.error('[metadata] Failed to load store settings', error)
    return defaultMetadata
  }
}

export const viewport: Viewport = {
  themeColor: '#183d2a',
  width: 'device-width',
  initialScale: 1,
  userScalable: true,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${spaceMono.variable} font-sans antialiased`}>
        {children}
        <Toaster position="top-right" richColors />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
