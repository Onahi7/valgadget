import Link from 'next/link'
import Image from 'next/image'
import { Mail, Phone, Twitter } from 'lucide-react'

const FOOTER_LINKS = {
  shop: [
    { label: 'All Products', href: '/shop' },
    { label: 'Hot Deals', href: '/deals' },
    { label: 'Live Raffles', href: '/raffles' },
    { label: 'New Arrivals', href: '/shop?sort=newest' },
    { label: 'Categories', href: '/categories' },
  ],
  account: [
    { label: 'Sign In', href: '/login' },
    { label: 'Register', href: '/register' },
    { label: 'My Orders', href: '/account/orders' },
    { label: 'Wishlist', href: '/wishlist' },
    { label: 'Affiliate Program', href: '/affiliate' },
  ],
  help: [
    { label: 'About Us', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'FAQs', href: '/faq' },
    { label: 'Return Policy', href: '/legal/returns' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/legal/privacy' },
    { label: 'Terms of Service', href: '/legal/terms' },
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

const PAYMENT_BADGES = ['Paystack', 'Visa', 'Mastercard', 'Verve', 'Crypto']

export function Footer() {
  return (
    <footer className="mt-24 bg-secondary text-secondary-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main footer */}
        <div className="grid grid-cols-2 gap-8 py-16 md:grid-cols-6">
          {/* Brand — spans two columns */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center">
              <Image src="/logo.png" alt="Val Gadgets" width={160} height={56} className="h-12 w-auto object-contain" />
            </Link>
            <p className="mt-4 max-w-[220px] text-sm leading-relaxed text-secondary-foreground/60">
              Your number 1 gadget plug. Solution to every gadget need — with
              nationwide delivery across Nigeria.
            </p>

            <div className="mt-5 space-y-2 text-sm">
              <a
                href="mailto:support@valgadgets.com"
                className="flex items-center gap-2 text-secondary-foreground/70 transition-colors hover:text-primary"
              >
                <Mail className="h-4 w-4 text-primary" />
                support@valgadgets.com
              </a>
              <a
                href="https://wa.me/2347038572046"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-secondary-foreground/70 transition-colors hover:text-primary"
              >
                <Phone className="h-4 w-4 text-primary" />
                +234 703 857 2046
              </a>
            </div>

            <div className="mt-6 flex items-center gap-3">
              {SOCIAL.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-secondary-foreground/15 text-secondary-foreground/60 transition-colors hover:border-primary/50 hover:text-primary"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {([
            { title: 'Shop', links: FOOTER_LINKS.shop },
            { title: 'Account', links: FOOTER_LINKS.account },
            { title: 'Help', links: FOOTER_LINKS.help },
            { title: 'Legal', links: FOOTER_LINKS.legal },
          ] as { title: string; links: { label: string; href: string }[] }[]).map(section => (
            <div key={section.title}>
              <h3 className="mb-4 font-mono text-xs font-bold uppercase tracking-widest text-secondary-foreground/50">
                {section.title}
              </h3>
              <ul className="flex flex-col gap-2.5">
                {section.links.map(link => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-secondary-foreground/65 transition-colors hover:text-primary"
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
        <div className="flex flex-col items-center justify-between gap-4 border-t border-secondary-foreground/10 py-7 sm:flex-row">
          <p className="text-xs text-secondary-foreground/40">
            &copy; {new Date().getFullYear()} Val Gadgets. All rights reserved.
          </p>

          {/* Payment method badges */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {PAYMENT_BADGES.map(name => (
              <span
                key={name}
                className="rounded-full border border-secondary-foreground/15 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-secondary-foreground/55"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}