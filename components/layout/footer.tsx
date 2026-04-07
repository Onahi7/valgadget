import Link from 'next/link'
import { Zap, Twitter, Instagram, Youtube, Github } from 'lucide-react'

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
    { label: 'FAQ', href: '/faq' },
    { label: 'Blog', href: '/blog' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/legal/privacy' },
    { label: 'Terms of Service', href: '/legal/terms' },
    { label: 'Return Policy', href: '/legal/returns' },
    { label: 'Cookie Policy', href: '/legal/cookies' },
  ],
}

const SOCIAL = [
  { label: 'Twitter', href: 'https://twitter.com', Icon: Twitter },
  { label: 'Instagram', href: 'https://instagram.com', Icon: Instagram },
  { label: 'YouTube', href: 'https://youtube.com', Icon: Youtube },
  { label: 'GitHub', href: 'https://github.com', Icon: Github },
]

export function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer */}
        <div className="py-16 grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-1.5 font-mono font-bold text-xl tracking-tight">
              <span className="text-primary">VAL</span>
              <span className="text-secondary-foreground">GADGET</span>
              <Zap className="w-4 h-4 text-primary" aria-hidden />
            </Link>
            <p className="mt-4 text-sm text-secondary-foreground/60 leading-relaxed max-w-[200px]">
              Next-level tech gear for bold people. Shop, win, upgrade.
            </p>
            <div className="flex items-center gap-3 mt-6">
              {SOCIAL.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="text-secondary-foreground/40 hover:text-primary transition-colors"
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
