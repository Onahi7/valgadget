# ValGadget API Documentation

Base URL: `/api`

Authentication: JWT via `Authorization: Bearer <token>` header or `vg_token` cookie.

Roles: `customer`, `affiliate`, `admin`

---

## Auth

### POST `/api/auth/login`

Rate limit: 5 requests / 15 min per IP.

**Body:**
```json
{ "email": "string", "password": "string" }
```

**Response 200:**
```json
{
  "token": "jwt",
  "user": {
    "id": "uuid",
    "name": "string",
    "email": "string",
    "role": "customer|affiliate|admin",
    "avatar": "string|null",
    "phone": "string|null",
    "isVerified": true,
    "affiliateCode": "string|null",
    "createdAt": "ISO",
    "updatedAt": "ISO"
  }
}
```

**Errors:** 401 (invalid credentials), 429 (rate limited)

---

### POST `/api/auth/register`

Rate limit: 3 / 10 min per IP.

**Body:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string (min 8)",
  "role": "customer|affiliate",
  "affiliateCode": "string (optional)"
}
```

**Response 201:** Token + user object (same shape as login).

**Errors:** 409 (duplicate email), 422 (validation), 429 (rate limited)

---

### POST `/api/auth/logout`

**Response 200:** `{ "message": "Logged out successfully." }`

---

### GET `/api/auth/me`

Auth required: Yes (any role).

**Response 200:** User object (without password hash).

---

### PATCH `/api/auth/me`

Auth required: Yes. **Body:** `{ "name"?: string, "phone"?: string, "avatar"?: string }`

**Response 200:** Updated user object.

---

### PATCH `/api/auth/profile`

Auth required: Yes. Like `PATCH /me` but also allows email change (resets `isVerified`).

**Body:** `{ "name"?: string, "email"?: string, "phone"?: string, "avatar"?: string }`

**Errors:** 409 (email already in use)

---

### POST `/api/auth/change-password`

Auth required: Yes. Rate limit: 5 / 15 min per IP.

**Body:**
```json
{
  "currentPassword": "string",
  "newPassword": "string",
  "confirmPassword": "string"
}
```

**Response 200:** `{ "message": "Password changed successfully." }`

**Errors:** 401 (incorrect current password)

---

### POST `/api/auth/forgot-password`

Rate limit: 3 / 60 min per IP.

**Body:** `{ "email": "string" }`

**Response 200:** `{ "message": "If an account exists for this email, a reset link has been sent." }`

---

### POST `/api/auth/reset-password`

Rate limit: 3 / 60 min per IP.

**Body:** `{ "token": "string", "password": "string", "passwordConfirmation": "string" }`

**Response 200:** `{ "message": "Password reset successfully. Please sign in." }`

**Errors:** 400 (expired/invalid token, password mismatch)

---

### POST `/api/auth/verify-email`

**Body:** `{ "token": "string" }`

**Response 200:** `{ "message": "Email verified successfully." }`

**Errors:** 400 (invalid/expired token)

---

### POST `/api/auth/resend-optional`

**Body (optional if authenticated):** `{ "email": "string" }`

**Response 200:** `{ "message": "If your account exists and is unverified, a new link has been sent." }`

---

## Products

### GET `/api/products`

Public. Paginated product listing with filters.

**Query params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 12 | Items per page (max 100) |
| `category` | string | — | Category slug |
| `search` | string | — | Full-text search |
| `minPrice` | number | — | Minimum price |
| `maxPrice` | number | — | Maximum price |
| `featured` | "true" | — | Featured only |
| `isNew` | "true" | — | New arrivals only |
| `inStock` | "true" | — | In stock only |
| `brand` | string | — | Comma-separated brand names |
| `sort` | string | newest | `newest`, `price_asc`, `price_desc`, `rating`, `popular` |

**Response 200:**
```json
{
  "data": [{
    "id": "uuid",
    "name": "string",
    "slug": "string",
    "description": "string",
    "shortDescription": "string|null",
    "specs": [],
    "price": 0,
    "comparePrice": null,
    "images": ["url"],
    "categoryId": "uuid",
    "stock": 0,
    "sku": "string",
    "rating": 0,
    "reviewCount": 0,
    "tags": [],
    "featured": false,
    "isNew": false,
    "isActive": true,
    "brand": "string|null",
    "createdAt": "ISO",
    "updatedAt": "ISO",
    "category": { "id": "uuid", "name": "string", "slug": "string" }
  }],
  "total": 0,
  "page": 1,
  "limit": 12,
  "totalPages": 0
}
```

---

### GET `/api/products/[id]`

Public. Single product by ID with category.

---

### GET `/api/products/slug/[slug]`

Public. Single product by slug with category.

---

### GET `/api/products/facets`

Public. Returns available filter facets for a category.

**Query:** `category` (slug, optional)

**Response 200:**
```json
{
  "brands": [{ "value": "string", "count": 0 }],
  "priceRange": { "min": 0, "max": 0 },
  "availability": { "inStock": 0, "outOfStock": 0, "total": 0 },
  "tags": [{ "value": "string", "count": 0 }]
}
```

---

### GET `/api/products/featured`

Public. **Query:** `limit` (default 8, max 20). Returns array of products.

---

### GET `/api/products/new-arrivals`

Public. **Query:** `limit` (default 8, max 20). Returns array of products.

---

### GET `/api/products/[id]/related`

Public. Products from the same category. **Query:** `limit` (default 6, max 12).

---

### GET `/api/products/[id]/reviews`

Public. Paginated reviews for a product.

**Query:** `page` (default 1), `limit` (default 10, max 50)

**Response 200:**
```json
{
  "data": [{
    "id": "uuid",
    "rating": 5,
    "title": "string",
    "body": "string",
    "createdAt": "ISO",
    "user": { "id": "uuid", "name": "string", "avatar": "string|null" }
  }],
  "total": 0,
  "page": 1,
  "limit": 10,
  "totalPages": 0
}
```

---

### POST `/api/products/[id]/reviews`

Auth required. **Body:** `{ "rating": 1-5, "title"?: string, "body": "string" }`

**Response 201:** Created review. **Errors:** 409 (duplicate), 404 (not found)

---

### GET `/api/products/[id]/variants`

Public. Returns array of active variants sorted by `sortOrder`.

---

## Categories

### GET `/api/categories`

Public. Active categories with `productCount` and display images.

---

### GET `/api/categories/[id]`

Public. Single category with `productCount`.

---

### GET `/api/categories/flat`

Public. Flat array of all active categories.

---

### GET `/api/categories/slug/[slug]`

Public. Single category by slug.

---

## Orders

### GET `/api/orders`

Auth required. Admin sees all; customer sees own only.

**Query:** `page` (default 1), `limit` (default 10, max 50), `status`

---

### POST `/api/orders`

Public (supports guest checkout). Rate limit: 10 / 60 sec per IP.

**Body:**
```json
{
  "items": [{ "productId": "uuid", "quantity": 1 }],
  "shippingAddress": {
    "fullName": "string",
    "line1": "string",
    "line2": "string (optional)",
    "city": "string",
    "state": "string",
    "postalCode": "string (optional)",
    "country": "NG",
    "phone": "string"
  },
  "couponCode": "string (optional)",
  "affiliateCode": "string (optional)",
  "paymentMethod": "paystack (optional)",
  "notes": "string (optional)",
  "guestEmail": "string (optional, required for guests)",
  "idempotencyKey": "string (optional)"
}
```

**Response 201:** Created order with `reference` and numeric amounts.

**Errors:** 400 (validation), 409 (duplicate idempotency), 422 (product not found)

---

### GET `/api/orders/[id]`

Auth required. Customer sees own only; admin sees all.

---

### PATCH `/api/orders/[id]`

Auth required: Admin only.

**Body:**
```json
{
  "status": "pending|processing|confirmed|shipped|delivered|cancelled|refunded",
  "paymentStatus": "unpaid|pending|pending_verification|paid|failed|refunded",
  "paymentRef": "string (optional)"
}
```

---

### PATCH `/api/orders/[id]/cancel`

Auth required. Customer only, must own order, order must be pending.

**Response 200:** `{ "message": "Order cancelled successfully." }`

---

### GET `/api/orders/me`

Auth required. Current user's orders. Same query params as `GET /api/orders`.

---

### GET `/api/orders/me/[id]`

Auth required. Current user's single order.

---

### PATCH `/api/orders/me/[id]`

Auth required. Cancels a pending order belonging to current user.

---

### GET `/api/orders/guest/[id]`

Public. Guest order lookup (orders without `userId`). **Errors:** 403 (non-guest order)

---

## Payments

### GET `/api/payments`

Public. **Query:** `reference` or `tx_ref` (required).

**Response 200:** `{ "id", "reference", "status", "paymentStatus", "total" }`

---

### POST `/api/payments`

External (Paystack webhook). Verifies HMAC signature. Confirms payment.

---

### POST `/api/payments/initiate`

Public (supports guest). Initiates payment for an order.

**Body:** `{ "orderId": "uuid", "method"?: "card|crypto", "returnUrl"?: "string", "cancelUrl"?: "string", "guestEmail"?: "string" }`

**Response 200:** Payment intent with `authorization_url` or crypto details.

---

### GET `/api/payments/[id]`

Auth required. Must own the order.

---

### GET `/api/payments/order/[orderId]`

Auth required. Must own the order.

---

### POST `/api/payments/paystack/initialize`

Public (supports guest). Initializes Paystack transaction.

**Body:** `{ "orderId": "uuid", "guestEmail"?: "string" }`

**Response 200:**
```json
{
  "authorization_url": "https://checkout.paystack.com/...",
  "reference": "string",
  "access_code": "string"
}
```

---

### GET `/api/payments/paystack/verify`

Public. Paystack redirect callback. **Query:** `reference` (required), `orderId` (optional).

Redirects to order page or checkout with success/error.

---

### POST `/api/payments/paystack/requery`

Auth required. Must own the order.

**Body:** `{ "orderId": "uuid" }`

**Response 200:** `{ "paymentStatus", "status", "message?" }`

---

### GET `/api/payments/crypto`

Public. Returns wallet addresses.

**Response 200:**
```json
{
  "btc": "string",
  "eth": "string",
  "usdt_erc20": "string",
  "usdt_trc20": "string"
}
```

---

### POST `/api/payments/crypto`

Auth required. Submits a crypto transaction hash.

**Body:** `{ "orderId": "uuid", "txHash": "string", "coin": "btc|eth|usdt_erc20|usdt_trc20" }`

**Response 200:** `{ "message": "Transaction hash received. Your payment will be verified within 1-30 minutes." }`

**Errors:** 400 (invalid format), 409 (duplicate hash or already paid)

---

### POST `/api/payments/webhook`

External. Delegates to `POST /api/payments`.

---

## Coupons

### POST `/api/coupons/validate`

Public. Rate limit: 30 / 60 sec per IP.

**Body:** `{ "code": "string", "cartTotal": 0 }`

**Response 200:**
```json
{
  "code": "string",
  "type": "fixed|percent",
  "discount": 0,
  "message": "string"
}
```

**Errors:** 400 (invalid/expired, usage limit exceeded, min purchase not met)

---

## Reviews

### GET `/api/reviews`

Public. **Query:** `productId` (required).

**Response 200:** Array of reviews with user info.

---

### POST `/api/reviews`

Auth required. Rate limit: 5 / 60 min per IP.

**Body:** `{ "productId": "uuid", "rating": 1-5, "title"?: string, "body": "string" }`

**Response 201:** Created review with `verified` badge if user purchased the product.

**Errors:** 400 (duplicate review)

---

## Wishlist

### GET `/api/wishlist`

Auth required. Returns wishlist items with full product details.

---

### POST `/api/wishlist`

Auth required. Rate limit: 10 / 60 sec per IP.

**Body:** `{ "productId": "uuid" }`

---

### DELETE `/api/wishlist`

Auth required. Clears entire wishlist.

---

### DELETE `/api/wishlist/[productId]`

Auth required. Removes a single item.

---

### GET `/api/wishlist/check/[productId]`

Auth required. **Response:** `{ "isInWishlist": boolean }`

---

### POST `/api/wishlist/move-to-cart`

Auth required. **Body:** `{ "productId": "uuid" }`

Removes from wishlist. Add to cart client-side.

---

## Shipping Rates

### GET `/api/shipping-rates`

Public. Active rates with state, price, estimatedDays.

---

### POST `/api/shipping-rates`

Auth required: Admin. Upserts by state.

**Body:** `{ "state": "string", "price": 0, "estimatedDays": 0 }`

---

### PATCH `/api/shipping-rates/[id]`

Auth required: Admin. **Body:** `{ "price"?: number, "estimatedDays"?: number, "isActive"?: boolean }`

---

### DELETE `/api/shipping-rates/[id]`

Auth required: Admin.

---

## Chat

### POST `/api/chat`

Public (supports guest). Rate limit: 20 / 60 sec per IP.

**Body:** `{ "subject"?: string, "guestName"?: string, "guestEmail"?: "string (required for guests)", "productId"?: "uuid" }`

**Response 200:** Created chat session.

---

### GET `/api/chat`

Auth required: Admin only. Returns last 100 sessions.

---

### GET `/api/chat/[sessionId]/messages`

Auth required. Session owner or admin.

**Response 200:** Array of messages sorted by `createdAt` ascending.

---

### POST `/api/chat/[sessionId]/messages`

Auth required. Session owner or admin. Rate limit: 20 / 60 sec.

**Body:** `{ "content": "string", "senderName"?: "string" }`

Admin role auto-assigned if caller is admin.

**Errors:** 400 (closed session, empty content), 403 (not owner/admin), 404 (not found)

---

## Raffles

### GET `/api/raffles`

Public. **Query:** `status` (optional). Returns raffles with numeric `prizeValue` and `ticketPrice`.

---

### GET `/api/raffles/[id]`

Public. Returns raffle with `isEntered` and `myTicketCount` if authenticated.

---

### POST `/api/raffles/[id]`

Auth required. **Body:** `{ "ticketCount"?: number (default 1) }`

**Response 201:** Entry with `totalPaid`.

**Errors:** 409 (not enough tickets, atomic race protection)

---

### POST `/api/raffles/[id]/enter`

Auth required. Rate limit: 10 / 60 sec per user. Same as `POST /api/raffles/[id]`.

---

### GET `/api/raffles/[id]/entries`

Auth required. **Query:** `page` (default 1), `limit` (default 10, max 50).

**Response 200:**
```json
{
  "data": [{
    "id": "uuid",
    "raffleId": "uuid",
    "userId": "uuid",
    "ticketCount": 0,
    "ticketNumbers": "string",
    "totalPaid": 0,
    "createdAt": "ISO",
    "user": { "name": "string" }
  }],
  "total": 0
}
```

---

### GET `/api/raffles/my-entries`

Auth required. **Query:** `page`, `limit`. Returns entries with raffle details.

---

## Affiliates

### GET `/api/affiliate`

Auth required: Affiliate or Admin.

**Response 200:**
```json
{
  "code": "string",
  "balance": 0,
  "totalClicks": 0,
  "conversions": 0,
  "conversionRate": 0,
  "totalCommission": 0,
  "recentActivity": []
}
```

---

### POST `/api/affiliate`

Public. Rate limit: 30 / 60 sec per IP. Tracks affiliate clicks.

**Body:** `{ "code": "string", "referrer"?: "string" }`

---

### GET `/api/affiliate/stats`

Auth required: Affiliate or Admin.

**Response 200:**
```json
{
  "affiliateCode": "string",
  "totalClicks": 0,
  "totalConversions": 0,
  "conversionRate": 0,
  "totalEarnings": 0,
  "pendingEarnings": 0,
  "paidEarnings": 0,
  "thisMonthClicks": 0,
  "thisMonthConversions": 0,
  "thisMonthEarnings": 0,
  "commissionRate": 0,
  "lifetimeOrders": 0
}
```

---

### GET `/api/affiliate/revenue-chart`

Auth required: Affiliate or Admin. **Query:** `period` (week|month|year, default: month).

**Response 200:** Array of `{ "date", "clicks", "conversions", "earnings" }` per day.

---

### GET `/api/affiliate/clicks`

Auth required: Affiliate or Admin. **Query:** `page` (default 1), `limit` (default 20, max 100), `converted` ("true"|"false").

---

### GET `/api/affiliate/links`

Auth required: Affiliate or Admin. Returns array of `{ "url", "code", "clicks", "conversions", "createdAt" }`.

---

### POST `/api/affiliate/links`

Auth required: Affiliate or Admin.

**Body:** `{ "productSlug"?: "string" }`

**Response 201:** `{ "url", "code", "productSlug", "clicks": 0, "conversions": 0, "createdAt" }`

---

### GET `/api/affiliate/payouts`

Auth required: Affiliate or Admin. **Query:** `page`, `limit`.

---

### POST `/api/affiliate/payouts`

Auth required: Affiliate or Admin.

**Body:** `{ "amount": 0, "method": "string", "accountDetails"?: "string" }`

**Errors:** 400 (insufficient balance)

---

## Contact

### POST `/api/contact`

Public. Rate limit: 3 / 10 min per IP. Sends admin notification email + auto-reply.

**Body:** `{ "name": "string", "email": "string", "subject"?: "string", "message": "string" }`

---

## ImageKit

### GET `/api/imagekit/auth`

Auth required. Returns ImageKit upload credentials (signature, token, expiry).

---

## Addresses

### GET `/api/addresses`

Auth required. Returns user's addresses sorted by default first.

---

### POST `/api/addresses`

Auth required.

**Body:**
```json
{
  "label": "string",
  "fullName": "string",
  "line1": "string",
  "line2": "string (optional)",
  "city": "string",
  "state": "string",
  "postalCode": "string (optional)",
  "country": "NG",
  "phone": "string",
  "isDefault": false
}
```

---

### GET `/api/addresses/[id]`

Auth required. Must own.

---

### PATCH `/api/addresses/[id]`

Auth required. Must own. Same fields as POST, all optional.

---

### DELETE `/api/addresses/[id]`

Auth required. Must own.

---

## Admin

All admin routes require authentication with `admin` role.

### Products

| Method | Route | Body | Notes |
|--------|-------|------|-------|
| GET | `/api/admin/products` | — | Paginated, includes `cost`, `lowStockThreshold`, `displayImage`, `imageStatus` |
| POST | `/api/admin/products` | `{ name, price, sku, description?, shortDescription?, specs?, comparePrice?, cost?, categoryId?, stock?, tags?, featured?, isNew?, isActive?, images? }` | 201 |
| GET | `/api/admin/products/[id]` | — | Single product |
| PUT | `/api/admin/products/[id]` | `{ name?, description?, shortDescription?, specs?, price?, comparePrice?, cost?, categoryId?, stock?, sku?, tags?, featured?, isNew?, isActive?, images? }` | Updated product |
| DELETE | `/api/admin/products/[id]` | — | Soft delete (deactivates) |
| POST | `/api/admin/products/[id]/images` | FormData `images` files | Uploaded via ImageKit |
| DELETE | `/api/admin/products/[id]/images` | `{ "imageUrl": "string" }` | Removes image |

---

### Categories

| Method | Route | Body |
|--------|-------|------|
| GET | `/api/admin/categories` | — |
| POST | `/api/admin/categories` | `{ name, description?, image?, icon?, parentId?, isActive?, sortOrder? }` |
| PUT | `/api/admin/categories/[id]` | Same fields |
| DELETE | `/api/admin/categories/[id]` | — |
| PATCH | `/api/admin/categories/reorder` | `{ items: [{ id, sortOrder }] }` |

---

### Orders

| Method | Route | Body | Notes |
|--------|-------|------|-------|
| GET | `/api/admin/orders` | — | Paginated + `summary` (revenue, counts by status) |
| GET | `/api/admin/orders/[id]` | — | Single order |
| PATCH | `/api/admin/orders/[id]` | `{ status?, paymentStatus?, paymentRef?, notes?, trackingNumber? }` | |
| PATCH | `/api/admin/orders/[id]/status` | `{ status }` | |
| PATCH | `/api/admin/orders/[id]/tracking` | `{ trackingNumber, trackingUrl? }` | |
| PATCH | `/api/admin/orders/[id]/notes` | `{ note }` | |
| PATCH | `/api/admin/orders/[id]/payment-status` | `{ paymentStatus }` | |
| GET | `/api/admin/orders/stats` | — | Revenue by day. Query: `from?`, `to?` (ISO) |
| GET | `/api/admin/orders/export` | — | CSV download. Query: `status?`, `search?` |

---

### Dashboard

| Method | Route | Notes |
|--------|-------|-------|
| GET | `/api/admin/dashboard/stats` | Revenue, orders, customers, products, affiliates, raffles |
| GET | `/api/admin/dashboard/top-products` | Query: `limit` (default 5, max 20) |
| GET | `/api/admin/dashboard/recent-orders` | Query: `limit` (default 10, max 50) |
| GET | `/api/admin/dashboard/revenue-chart` | Query: `days` (default 30, max 90) |

---

### Payments

| Method | Route | Body | Notes |
|--------|-------|------|-------|
| GET | `/api/admin/payments` | — | Paginated. Query: `page`, `limit`, `status`, `method` |
| POST | `/api/admin/payments/refund` | `{ orderId, reason?, transactionId? }` | Attempts Paystack refund |

---

### Users

| Method | Route | Body | Notes |
|--------|-------|------|-------|
| GET | `/api/admin/users` | — | Paginated with `orders` count + `spent`. Query: `page`, `limit`, `role`, `search` |
| GET | `/api/admin/users/[id]` | — | Single user |
| PATCH | `/api/admin/users/[id]` | `{ name?, role?, phone?, isVerified? }` | Cannot demote self |
| DELETE | `/api/admin/users/[id]` | — | Cannot delete self |
| POST | `/api/admin/users/invite` | `{ email, role?: "customer|affiliate" }` | Sends invite email |

---

### Coupons

| Method | Route | Body |
|--------|-------|------|
| GET | `/api/admin/coupons` | — |
| POST | `/api/admin/coupons` | `{ code, type, value?, minPurchase?, maxDiscount?, usageLimit?, expiresAt? }` |
| PATCH | `/api/admin/coupons/[id]` | Same fields + `isActive?` |
| DELETE | `/api/admin/coupons/[id]` | — |

---

### Reviews

| Method | Route | Body | Notes |
|--------|-------|------|-------|
| GET | `/api/admin/reviews` | — | All reviews with product and user info |
| PATCH | `/api/admin/reviews/[id]` | `{ isActive: boolean }` | Toggle visibility |
| DELETE | `/api/admin/reviews/[id]` | — | Permanently delete |

---

### Raffles

| Method | Route | Body | Notes |
|--------|-------|------|-------|
| GET | `/api/admin/raffles` | — | Paginated with numeric values |
| POST | `/api/admin/raffles` | `{ title, prize, prizeValue, ticketPrice, maxTickets, drawDate, description?, image?, status? }` | 201 |
| GET | `/api/admin/raffles/[id]` | — | Raffle + all entries with user info |
| PATCH | `/api/admin/raffles/[id]` | `{ status?, winnerId?, drawDate?, description? }` | Emails winner if assigned |
| DELETE | `/api/admin/raffles/[id]` | — | Only upcoming raffles |

---

### Affiliates

| Method | Route | Body | Notes |
|--------|-------|------|-------|
| GET | `/api/admin/affiliates` | — | Paginated with click/earnings stats |
| GET | `/api/admin/affiliates/stats` | — | Aggregate stats |
| POST | `/api/admin/affiliates/[id]/payout` | `{ method?, notes? }` | Process payout |
| PATCH | `/api/admin/affiliates/[id]/commission` | `{ commissionRate: 0-1 }` | Update rate |
| GET | `/api/admin/affiliates/payouts` | — | All payouts. Query: `status?` |
| PATCH | `/api/admin/affiliates/payouts/[id]` | `{ status?, reference?, notes? }` | Update payout |

---

### Assets

| Method | Route | Body | Notes |
|--------|-------|------|-------|
| POST | `/api/admin/assets/[type]` | FormData `file` (image, max 5MB) | Uploads to ImageKit under `/valgadget/{type}` |

---

### Settings

| Method | Route | Body |
|--------|-------|------|
| GET | `/api/admin/settings` | — |
| PUT | `/api/admin/settings` | `{ settings: { "key": "value" } }` |

---

### Stats

| Method | Route | Notes |
|--------|-------|-------|
| GET | `/api/admin/stats` | Users, orders, products, raffle entries counts |

---

## Rate Limits

| Preset | Max Requests | Window |
|--------|-------------|--------|
| `auth` | 5 | 15 min |
| `register` | 3 | 10 min |
| `passwordReset` | 3 | 60 min |
| `api` | 60 | 1 min |
| `chat` | 20 | 1 min |
| `review` | 5 | 60 min |
| `coupon` | 30 | 1 min |
| `wishlist` | 10 | 1 min |
| `POST /api/orders` (IP) | 10 | 60 sec |
| `POST /api/affiliate` (IP) | 30 | 60 sec |
| `POST /api/contact` (IP) | 3 | 600 sec |
| `POST /api/raffles/[id]/enter` (user) | 10 | 60 sec |

---

## Error Responses

All errors follow this shape:

```json
{
  "error": "Error message",
  "message": "Human-readable description (optional)"
}
```

Common HTTP codes:

| Code | Meaning |
|------|---------|
| 400 | Bad request / validation error |
| 401 | Not authenticated / invalid token |
| 403 | Authenticated but not authorized |
| 404 | Resource not found |
| 409 | Conflict (duplicate, already exists) |
| 422 | Unprocessable entity |
| 429 | Rate limited |
| 500 | Internal server error |
