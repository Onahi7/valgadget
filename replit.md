# ValGadget — Nigerian Tech Gadget E-Commerce

## Overview
Full-stack Next.js e-commerce app for a Nigerian tech gadget store, competitive with mygadgetpadi.com. Features product browsing, cart/checkout, live gadget raffles, admin panel, affiliate program, chat widget, and a polished mobile-responsive UI.

## Tech Stack
- **Framework**: Next.js 16 (App Router, Turbopack), React 19
- **Styling**: TailwindCSS v4
- **Database**: Neon PostgreSQL via Drizzle ORM
- **Auth**: Session-based (cookie), bcrypt password hashing
- **UI components**: Radix UI / shadcn
- **Package manager**: pnpm (monorepo)
- **Dev port**: 5000

## Architecture
```
app/
  (main)/            — customer-facing pages (layout with Header + Footer + ChatWidget + AnnouncementBar)
    page.tsx         — Homepage (hero, trust badges, quick categories, featured, promo banners, raffles, new arrivals, how-it-works, newsletter, affiliate CTA)
    shop/            — Shop with category/search filter, sort, pagination
    products/[slug]/ — Product detail (images, variants, reviews, related)
    categories/      — Category grid
    raffles/         — Live raffles with countdown timers
    cart/, checkout/ — Cart and checkout flow
    account/         — User dashboard, orders, addresses, profile
    affiliate/       — Affiliate program dashboard
    about/, contact/, faq/ — Marketing pages
    legal/           — Privacy, terms, returns, cookies
    wishlist/        — Wishlist
  admin/             — Admin panel (protected by AdminGuard)
    page.tsx         — Dashboard (KPIs + recent orders)
    products/        — Products CRUD
    categories/      — Categories CRUD
    orders/          — Orders management
    customers/       — Customer list
    reviews/         — Review moderation
    raffles/         — Raffle management + draw
    coupons/         — Coupon/discount codes
    affiliate/       — Affiliate stats overview
    shipping/        — Shipping rates per Nigerian state
    settings/        — Store settings (store info, payments, email, SEO)
  api/               — REST API routes (products, categories, orders, reviews, raffles, auth, etc.)
lib/
  server/            — Drizzle schema, db connection, auth helpers
  services/          — Client-side service layers (product, order, affiliate, raffle, etc.)
components/
  layout/            — Header (2-row with search bar), Footer, AnnouncementBar (rotating text)
  admin/             — AdminSidebar, AdminHeader, AdminDashboardClient
  ecommerce/         — ProductCard, ProductGrid, CartItem, CheckoutSummary, etc.
  ui/                — shadcn base components
```

## Key Design Decisions
- **Header**: 2-row layout — search bar (orange border) on top row, nav links on bottom row, "Live Raffles" orange pill CTA
- **Announcement bar**: Rotating promotional messages above header (dismissible)
- **Homepage sections**: Hero → Trust badges → Quick categories (10 icons) → Featured products → Promo banners → Live raffles → New arrivals → How it works → Newsletter → Affiliate CTA
- **Images**: `next.config.mjs` has `unoptimized: true` — all external Unsplash URLs work
- **Admin auth**: AdminGuard component redirects unauthenticated users to `/login`
- **Dev origins**: `allowedDevOrigins: ['*.worf.replit.dev', '*.replit.dev']` in next.config.mjs

## Database
- Neon PostgreSQL via `DATABASE_URL` in `.env.local`
- 46 products, 37 categories, 3 active raffles seeded
- Admin user: `admin@valgadget.ng` / `ValGadget2026!` (role: admin)
- Seed scripts: `scripts/ensure-admin.ts`, `scripts/seed-market-catalog.ts`, `scripts/seed-raffles.ts`

## Running
```bash
PORT=5000 pnpm run dev
```

## Important Files
- `components/layout/header.tsx` — Two-row header with search bar and nav
- `components/layout/announcement-bar.tsx` — Rotating announcement bar
- `app/(main)/page.tsx` — Homepage with all sections including Newsletter
- `app/(main)/layout.tsx` — Main layout (includes AnnouncementBar)
- `app/admin/layout.tsx` — Admin layout with AdminGuard + sidebar
- `next.config.mjs` — Images unoptimized, allowedDevOrigins, typescript ignoreBuildErrors

## Admin Access
Navigate to `/admin` — redirects to `/login` if unauthenticated.
Login with: `admin@valgadget.ng` / `ValGadget2026!`
