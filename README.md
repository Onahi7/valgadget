# ValGadget — Electronics E-Commerce Platform

ValGadget is a full-stack e-commerce platform built for selling gadgets and electronics in Nigeria. It covers everything from a customer-facing storefront to a complete admin dashboard, with real payment processing, live chat, a raffle/giveaway system, and an affiliate programme — all in one codebase.

---

## What's Inside

- **Storefront** — product catalogue, search, filtering, wishlists, cart, and checkout
- **Payments** — Paystack (cards, bank transfer, USSD) and direct crypto (BTC, ETH, USDT TRC-20/ERC-20)
- **Admin dashboard** — full CRUD for products, orders, customers, categories, raffles, shipping rates
- **Live chat** — floating widget for customers, real-time inbox for admins
- **Raffles** — create ticket-based prize draws with a countdown and automatic draw
- **Affiliate programme** — shareable referral links with earnings tracking
- **Nigerian shipping** — per-state delivery rates with auto-calculation at checkout
- **Auth** — JWT-based, role-gated routes (customer / affiliate / admin)
- **Email** — transactional emails via Resend (password reset, order confirmation)
- **Image uploads** — ImageKit CDN integration

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | Neon (serverless Postgres) |
| ORM | Drizzle ORM |
| Auth | JWT (custom, no NextAuth) |
| Payments | Paystack API + direct crypto wallets |
| Email | Resend |
| Images | ImageKit |
| State | React Context (cart, wishlist, auth) |
| Forms | React Hook Form + Zod |
| Package manager | pnpm |

---

## Prerequisites

Make sure you have these installed before you start:

- **Node.js** 18.17 or later — [nodejs.org](https://nodejs.org)
- **pnpm** — `npm install -g pnpm`
- **Git**

You'll also need accounts on:

- [neon.tech](https://neon.tech) — free Postgres database
- [resend.com](https://resend.com) — transactional email (free tier works)
- [imagekit.io](https://imagekit.io) — image storage and CDN (free tier works)
- [paystack.com](https://paystack.com) — payment gateway (Nigerian businesses)

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Onahi7/valgadget.git
cd valgadget
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

Copy the example file and fill in your values:

```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in every variable — see the [Environment Variables](#environment-variables) section below for details on each one.

### 4. Set up the database

Run the schema push to create all tables in your Neon database:

```bash
pnpm dlx drizzle-kit push
```

This creates all tables: `users`, `products`, `categories`, `orders`, `raffles`, `affiliateClicks`, `chatSessions`, `chatMessages`, `shippingRates`.

### 5. Start the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — the storefront is live.

Admin dashboard: [http://localhost:3000/admin](http://localhost:3000/admin)

---

## Environment Variables

All variables go in `.env.local`. Never commit this file — it's already in `.gitignore`.

### App

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=/api
```

Set `NEXT_PUBLIC_APP_URL` to your real domain in production (e.g. `https://valgadget.com`). Paystack uses this to build redirect URLs.

### Database (Neon)

```env
DATABASE_URL=postgresql://username:password@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

Get this from your Neon project dashboard → **Connection string**. Use the **pooled** connection string for the app.

> Neon is serverless Postgres — it scales to zero when idle and spins up in milliseconds. The free tier is enough to run this project in production.

### JWT Secret

```env
JWT_SECRET=your-secret-here
```

Generate a strong secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Paste the output as your `JWT_SECRET`. Keep this secret — anyone who has it can forge auth tokens.

### Resend (Email)

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=ValGadget <noreply@yourdomain.com>
```

1. Sign up at [resend.com](https://resend.com)
2. Add and verify your sending domain under **Domains**
3. Create an API key under **API Keys**
4. Set `RESEND_FROM_EMAIL` to an address on your verified domain

Without this, password reset emails and order confirmations won't send — the app still works, they just silently fail.

### ImageKit (Image Uploads)

```env
IMAGEKIT_PRIVATE_KEY=private_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=public_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/yourimagekitid
```

1. Sign up at [imagekit.io](https://imagekit.io)
2. Go to **Developer Options** → copy your public key, private key, and URL endpoint

Without this, product image uploads in the admin panel won't work.

### Paystack (Card / Bank Payments)

```env
PAYSTACK_SECRET_KEY=<your-paystack-secret-key>
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=<your-paystack-public-key>
```

1. Sign up at [paystack.com](https://paystack.com)
2. Go to **Settings → API Keys & Webhooks**
3. Use **test keys** during development, **live keys** in production

> During testing use `sk_test_...` and `pk_test_...`. Paystack test cards: card number `4084 xxxx xxxx xxxx` / any future expiry / CVV `408` — see [Paystack test cards docs](https://paystack.com/docs/payments/test-payments/).

### Crypto Wallets

```env
CRYPTO_BTC_ADDRESS=your-btc-wallet-address
CRYPTO_ETH_ADDRESS=your-eth-wallet-address
CRYPTO_USDT_TRC20_ADDRESS=your-usdt-trc20-wallet-address
CRYPTO_USDT_ERC20_ADDRESS=your-usdt-erc20-wallet-address
```

These are your actual wallet receive addresses. Customers will send crypto directly to these wallets and submit their transaction hash for verification. The exchange rate is fixed at **₦1,600 per $1 USD**.

---

## Creating the First Admin User

There's no sign-up flow for admin accounts — you create them directly in the database. Run this one-time script after your database is set up:

```bash
node -e "
const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const sql = neon(process.env.DATABASE_URL);
  const hash = await bcrypt.hash('YourPassword123!', 12);
  await sql\`
    INSERT INTO users (id, name, email, password, role, is_verified)
    VALUES (gen_random_uuid(), 'Admin', 'admin@yourdomain.com', \${hash}, 'admin', true)
    ON CONFLICT (email) DO UPDATE SET role = 'admin', password = \${hash}
  \`;
  console.log('Admin user created.');
}
main();
"
```

Replace the email and password with your own. After running it, log in at `/login`.

---

## Project Structure

```
valgadget/
├── app/
│   ├── (auth)/              # Login, register, forgot password
│   ├── (main)/              # Customer storefront
│   │   ├── page.tsx         # Homepage
│   │   ├── shop/            # Product catalogue with filters
│   │   ├── products/[slug]/ # Product detail page
│   │   ├── cart/            # Shopping cart
│   │   ├── checkout/        # Checkout with payment selection
│   │   ├── payment/         # Success and failed redirect pages
│   │   ├── account/         # Dashboard, orders, profile
│   │   ├── wishlist/        # Saved items
│   │   ├── raffles/         # Raffle listings and entry
│   │   └── affiliate/       # Affiliate dashboard
│   ├── admin/               # Admin dashboard (protected)
│   │   ├── products/        # Product CRUD
│   │   ├── orders/          # Order management
│   │   ├── customers/       # Customer list and detail
│   │   ├── categories/      # Category management
│   │   ├── raffles/         # Raffle management
│   │   ├── shipping/        # Per-state shipping rates
│   │   └── chat/            # Live chat inbox
│   └── api/                 # All API route handlers
│       ├── auth/            # Login, register, reset password
│       ├── products/        # Public product endpoints
│       ├── orders/          # Order creation and tracking
│       ├── payments/        # Paystack + crypto handlers
│       ├── chat/            # Chat session and messages
│       ├── shipping-rates/  # Shipping rate CRUD
│       ├── raffles/         # Raffle endpoints
│       ├── affiliate/       # Affiliate tracking
│       └── admin/           # Admin-only endpoints
├── components/
│   ├── admin/               # Admin-specific components
│   ├── auth/                # Protected route wrapper
│   ├── chat/                # Floating chat widget
│   ├── ecommerce/           # Product card, cart item, checkout summary
│   ├── layout/              # Header, footer
│   └── ui/                  # shadcn/ui primitives
├── contexts/                # Auth, cart, wishlist state
├── hooks/                   # Custom React hooks
├── lib/
│   ├── api-client.ts        # Typed fetch wrapper
│   ├── server/              # Drizzle schema, auth helpers, DB connection
│   └── services/            # Per-feature API service functions
└── .env.local.example       # Environment variable template
```

---

## Available Scripts

```bash
pnpm dev          # Start development server (localhost:3000)
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

For database schema changes:

```bash
pnpm dlx drizzle-kit push      # Push schema changes to the database
pnpm dlx drizzle-kit studio    # Open Drizzle Studio (DB browser GUI)
```

---

## Payment Flows

### Paystack
1. Customer selects Paystack at checkout
2. An order is created in the database with status `pending`
3. The server calls the Paystack API to initialise a transaction
4. Customer is redirected to the Paystack-hosted payment page
5. On success, Paystack redirects to `/api/payments/paystack/verify?reference=xxx`
6. The server verifies the transaction and marks the order as `paid`
7. Customer lands on `/payment/success`

### Crypto
1. Customer selects BTC / ETH / USDT at checkout
2. An order is created in the database
3. The wallet address is displayed with the exact NGN amount and USD equivalent (at ₦1,600/$1)
4. Customer sends the crypto and pastes their transaction hash
5. The hash is saved on the order — admin verifies manually and marks as paid

### Cash on Delivery
1. Order is created and confirmed immediately
2. Payment is collected on delivery

---

## Shipping

Delivery fees are stored per Nigerian state in the `shippingRates` table. All 37 states (including FCT Abuja) are pre-seeded with rates ranging from ₦1,500 (Lagos) to ₦4,000 (remote states).

Admins can update rates, enable/disable states, and set estimated delivery days from **Admin → Shipping Rates**.

At checkout, selecting a state auto-fetches the rate and adds it to the order total.

---

## Deployment

### Vercel (recommended)

1. Push your code to GitHub
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Add all environment variables in the Vercel dashboard (Project → Settings → Environment Variables)
4. Deploy

Vercel will auto-build and deploy on every push to `main`.

### Other platforms (Railway, Render, Fly.io)

Any Node.js-compatible platform works. Set all environment variables and run:

```bash
pnpm build && pnpm start
```

### Key things to do before going live

- [ ] Replace all placeholder wallet addresses with real ones
- [ ] Switch Paystack from test keys to live keys
- [ ] Set `NEXT_PUBLIC_APP_URL` to your production domain
- [ ] Add and verify your sending domain in Resend
- [ ] Set `IMAGEKIT_*` keys to your real ImageKit account
- [ ] Create your admin account in the database

---

## Roles & Access

| Role | Access |
|---|---|
| `customer` | Storefront, cart, orders, wishlist, profile |
| `affiliate` | All of customer + affiliate dashboard |
| `admin` | All of customer + full admin dashboard |

Role is set in the `users` table. Promote someone to admin by updating their `role` field directly in the database or via **Admin → Customers → [user] → Edit Role**.

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes with a clear message
4. Push and open a pull request

Please keep PRs focused. One feature or fix per PR makes review faster.

---

## License

MIT — do whatever you want with it, just don't remove the licence.

---

Built with care for the Nigerian market. Questions? Open an issue or ping us through the live chat on the platform.
