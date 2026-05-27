import Link from 'next/link'
import Image from 'next/image'
import { Twitter } from 'lucide-react'

const FOOTER_LINKS = {
  shop: [
    { label: 'All Products', href: '/shop' },
    { label: 'Categories', href: '/categories' },
    { label: 'Raffles', href: '/raffles' },
    { label: 'New Arrivals', href: '/shop?sort=newest' },
  ],
  account: [
    { label: 'Sign In', href: '/login' },
    { label: 'Register', href: '/register' },
    { label: 'My Orders', href: '/account/orders' },
    { label: 'Wishlist', href: '/wishlist' },
    { label: 'Affiliate Program', href: '/affiliate' },
  ],
  company: [
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/legal/privacy' },
    { label: 'Terms of Service', href: '/legal/terms' },
    { label: 'Return Policy', href: '/legal/returns' },
    { label: 'Cookie Policy', href: '/legal/cookies' },
  ],
}

// TikTok icon (not in lucide-react, use inline SVG)
const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
  </svg>
)

const SOCIAL = [
  { label: 'X / Twitter', href: 'https://x.com/Val_Gadget', Icon: Twitter },
  { label: 'TikTok', href: 'https://www.tiktok.com/@valgadgets', Icon: TikTokIcon },
]

export function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer */}
        <div className="py-16 grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center">
              <Image src="/logo.png" alt="Val Gadgets" width={140} height={50} className="h-10 w-auto object-contain" />
            </Link>
            <p className="mt-4 text-sm text-secondary-foreground/60 leading-relaxed max-w-[200px]">
              Your number 1 gadget plug. Solution to every gadget need - with nationwide delivery across Nigeria.
            </p>
            <div className="flex items-center gap-3 mt-6">
              {SOCIAL.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-secondary-foreground/40 transition-colors hover:bg-secondary-foreground/10 hover:text-primary"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {([
            { title: 'Shop', links: FOOTER_LINKS.shop },
            { title: 'Account', links: FOOTER_LINKS.account },
            { title: 'Company', links: FOOTER_LINKS.company },
            { title: 'Legal', links: FOOTER_LINKS.legal },
          ] as { title: string; links: { label: string; href: string }[] }[]).map(section => (
            <div key={section.title}>
              <h3 className="font-mono font-bold text-xs uppercase tracking-widest text-secondary-foreground/50 mb-4">
                {section.title}
              </h3>
              <ul className="flex flex-col gap-2">
                {section.links.map(link => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-secondary-foreground/60 hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-secondary-foreground/10 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-secondary-foreground/40">
            &copy; {new Date().getFullYear()} ValGadget. All rights reserved.
          </p>
          <p className="text-xs text-secondary-foreground/40">
            Built with passion for tech enthusiasts everywhere.
          </p>
        </div>
      </div>
    </footer>
  )
}
