# ValGadget

Full-stack e-commerce platform for electronics in Nigeria. Storefront, admin dashboard, payments, live chat, raffles, and affiliates — one codebase.

## Features

| Feature | Details |
|---|---|
| **Storefront** | Product catalogue, search, filtering, wishlists, cart, checkout |
| **Payments** | Paystack (cards, bank transfer, USSD) + crypto (BTC, ETH, USDT TRC-20/ERC-20) |
| **Admin dashboard** | CRUD for products, orders, customers, categories, raffles, shipping rates |
| **Live chat** | Floating widget for customers, real-time inbox for admins |
| **Raffles** | Ticket-based prize draws with countdown and automatic draw |
| **Affiliates** | Shareable referral links with earnings tracking |
| **Shipping** | Per-state Nigerian delivery rates with auto-calculation |
| **Auth** | JWT-based, role-gated (customer / affiliate / admin) |
| **Email** | Transactional emails via Resend (password reset, order confirmation) |
| **Image uploads** | ImageKit CDN integration |

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | Neon (serverless Postgres) |
| ORM | Drizzle ORM |
| Auth | JWT (custom — no NextAuth) |
| Payments | Paystack API + direct crypto wallets |
| Email | Resend |
| Images | ImageKit |
| State | React Context (cart, wishlist, auth) |
| Forms | React Hook Form + Zod |
| Package manager | pnpm |

## Quick Start

```bash
git clone https://github.com/Onahi7/valgadget.git
cd valgadget
pnpm install
cp .env.local.example .env.local   # fill in your values
pnpm dlx drizzle-kit push           # create tables in Neon
pnpm dev                            # http://localhost:3000
```

Admin dashboard: http://localhost:3000/admin

## Environment Variables

All variables go in `.env.local`. Never commit this file.

### App

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=/api
```

Set `NEXT_PUBLIC_APP_URL` to your real domain in production. Paystack uses this for redirect URLs.

### Database (Neon)

```env
DATABASE_URL=postgresql://username:password@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

Use the **pooled** connection string from your Neon dashboard. Free tier is sufficient.

### JWT

```env
JWT_SECRET=your-secret-here
```

Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### Resend (Email)

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=ValGadget <noreply@yourdomain.com>
```

1. Sign up at [resend.com](https://resend.com)
2. Add and verify your sending domain
3. Create an API key

Without this, emails silently fail — the app still works.

### ImageKit

```env
IMAGEKIT_PRIVATE_KEY=private_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=public_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/yourimagekitid
```

Without this, product image uploads in admin won't work.

### Paystack

```env
PAYSTACK_SECRET_KEY=<your-paystack-secret-key>
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=<your-paystack-public-key>
```

Use `sk_test_...` / `pk_test_...` during development. Test card: `4084 0000 0000 0000` / any future expiry / CVV `408`.

### Crypto Wallets

```env
CRYPTO_BTC_ADDRESS=your-btc-wallet-address
CRYPTO_ETH_ADDRESS=your-eth-wallet-address
CRYPTO_USDT_TRC20_ADDRESS=your-usdt-trc20-wallet-address
CRYPTO_USDT_ERC20_ADDRESS=your-usdt-erc20-wallet-address
```

Exchange rate fixed at ₦1,600 per $1 USD.

## Creating the First Admin

No sign-up flow for admin — create directly in the database:

```bash
pnpm admin:ensure
```

Or manually via the Neon SQL editor:

```sql
INSERT INTO users (id, name, email, password, role, is_verified)
VALUES (gen_random_uuid(), 'Admin', 'admin@yourdomain.com', '<bcrypt-hash>', 'admin', true)
ON CONFLICT (email) DO UPDATE SET role = 'admin', password = '<bcrypt-hash>';
```

## Project Structure

```
valgadget/
├── app/
│   ├── (auth)/                  # Login, register, forgot/reset password, verify email
│   ├── (main)/                  # Customer storefront
│   │   ├── page.tsx             # Homepage
│   │   ├── shop/                # Product catalogue with filters
│   │   ├── products/[slug]/     # Product detail
│   │   ├── categories/          # Category listing and detail
│   │   ├── cart/                # Shopping cart
│   │   ├── checkout/            # Checkout with payment selection
│   │   ├── payment/             # Success and failed redirect pages
│   │   ├── account/             # Dashboard, orders, profile, addresses
│   │   ├── wishlist/            # Saved items
│   │   ├── raffles/             # Raffle listings and entry
│   │   └── affiliate/           # Affiliate dashboard
│   ├── admin/                   # Admin dashboard (role-protected)
│   │   ├── products/            # Product list, create, edit
│   │   ├── orders/              # Order list and detail
│   │   ├── customers/           # Customer list and detail
│   │   ├── categories/          # Category management
│   │   ├── raffles/             # Raffle management
│   │   ├── coupons/             # Coupon management
│   │   ├── reviews/             # Review moderation
│   │   ├── shipping/            # Per-state shipping rates
│   │   ├── settings/            # Admin settings
│   │   └── chat/                # Live chat inbox
│   └── api/                     # All API route handlers
│       ├── auth/                # Login, register, reset password
│       ├── products/            # Public product endpoints
│       ├── orders/              # Order creation and tracking
│       ├── payments/            # Paystack + crypto handlers
│       ├── chat/                # Chat session and messages
│       ├── shipping-rates/      # Shipping rate CRUD
│       ├── raffles/             # Raffle endpoints
│       ├── affiliate/           # Affiliate tracking
│       └── admin/               # Admin-only endpoints
├── components/
│   ├── admin/                   # Admin-specific components (sidebar, header, dashboard, data table)
│   ├── auth/                    # ProtectedRoute wrapper
│   ├── chat/                    # Floating chat widget
│   ├── ecommerce/               # Product card, cart drawer, checkout, reviews, etc.
│   ├── layout/                  # Header, footer, announcement bar, mobile nav
│   ├── ui/                      # shadcn/ui primitives
│   └── providers.tsx            # Root providers (auth, cart, wishlist, theme)
├── contexts/                    # Auth, cart, cart drawer, wishlist context providers
├── hooks/                       # Custom hooks (useDebounce, useMobile, useToast)
├── lib/
│   ├── api-client.ts            # Typed fetch wrapper with JWT handling
│   ├── cart-helpers.ts          # Cart/wishlist data shape helpers
│   ├── utils.ts                 # cn(), formatPrice(), formatPriceShort()
│   ├── constants/               # Shared constants (admin status colors)
│   ├── data/                    # Static data (Nigerian states/locations)
│   ├── server/                  # Drizzle schema, DB connection, auth helpers, email, ImageKit
│   └── services/                # Per-feature API service functions
├── drizzle/                     # Database migrations
├── scripts/                     # Utility scripts (seeding, data fixes, verification)
├── styles/                      # globals.css (Tailwind + design tokens)
├── public/                      # Static files (favicon, images)
├── proxy.ts                     # Middleware: JWT auth + route protection
├── drizzle.config.ts            # Drizzle ORM config
├── next.config.mjs              # Next.js config
└── package.json
```

## Available Scripts

```bash
pnpm dev              # Start dev server (localhost:3000)
pnpm build            # Production build
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm admin:ensure     # Create/verify admin user exists
pnpm seed:market      # Seed market catalog data
```

Database management:

```bash
pnpm dlx drizzle-kit push       # Push schema changes to database
pnpm dlx drizzle-kit studio     # Open Drizzle Studio (DB browser)
```

## Payment Flows

### Paystack

1. Customer selects Paystack at checkout
2. Order created with status `pending`
3. Server calls Paystack API to initialise transaction
4. Customer redirected to Paystack-hosted payment page
5. On success, Paystack redirects to `/api/payments/paystack/verify?reference=xxx`
6. Server verifies transaction, marks order as `paid`
7. Customer lands on `/payment/success`

### Crypto

1. Customer selects BTC / ETH / USDT at checkout
2. Order created in database
3. Wallet address displayed with NGN amount and USD equivalent (₦1,600/$1)
4. Customer sends crypto and pastes transaction hash
5. Hash saved on order — admin verifies manually and marks as paid

### Cash on Delivery

1. Order created and confirmed immediately
2. Payment collected on delivery

## Shipping

Delivery fees stored per Nigerian state in `shippingRates` table. All 37 states (including FCT Abuja) pre-seeded with rates from ₦1,500 (Lagos) to ₦4,000 (remote states).

Admins can update rates, enable/disable states, and set estimated delivery days from **Admin → Shipping Rates**.

At checkout, selecting a state auto-fetches the rate and adds it to the order total.

## Deployment

### Vercel (recommended)

1. Push code to GitHub
2. Import at [vercel.com/new](https://vercel.com/new)
3. Add all environment variables in Vercel dashboard
4. Deploy

Auto-builds on every push to `main`.

### Other platforms (Railway, Render, Fly.io)

Any Node.js-compatible platform works:

```bash
pnpm build && pnpm start
```

### Pre-launch checklist

- [ ] Replace placeholder wallet addresses with real ones
- [ ] Switch Paystack from test keys to live keys
- [ ] Set `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Add and verify sending domain in Resend
- [ ] Set `IMAGEKIT_*` keys to real ImageKit account
- [ ] Create admin account in database

## Roles & Access

| Role | Access |
|---|---|
| `customer` | Storefront, cart, orders, wishlist, profile |
| `affiliate` | All of customer + affiliate dashboard |
| `admin` | All of customer + full admin dashboard |

Promote via **Admin → Customers → [user] → Edit Role** or directly in the database.

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit with a clear message
4. Push and open a pull request

Keep PRs focused — one feature or fix per PR.

## License

MIT
