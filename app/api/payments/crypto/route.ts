/**
 * POST /api/payments/crypto/confirm
 * User submits their TX hash after paying crypto.
 * Body: { orderId, txHash, coin }
 */
import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { orders } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req)
    if ('status' in auth) return auth
    const body = await req.json()
    const { orderId, txHash, coin } = body as { orderId: string; txHash: string; coin: string }

    if (!orderId || !txHash || !coin) return apiError('orderId, txHash and coin are required', 400)

    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)
    if (!order) return apiError('Order not found', 404)
    if (order.userId !== auth.user.sub) return apiError('Forbidden', 403)

    const validCoins = ['btc', 'eth', 'usdt_erc20', 'usdt_trc20']
    if (!validCoins.includes(coin.toLowerCase())) return apiError('Invalid coin', 400)

    await db.update(orders)
      .set({
        paymentMethod: `crypto_${coin.toLowerCase()}`,
        paymentStatus: 'pending_verification',
        paymentRef: txHash,
        notes: `Crypto TX Hash: ${txHash}`,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))

    return apiOk({ message: 'Transaction hash received. Your payment will be verified within 1–30 minutes.' })
  } catch (err) {
    console.error('[crypto/confirm]', err)
    return apiError('Failed to record transaction', 500)
  }
}

/**
 * GET /api/payments/crypto
 * Returns the configured wallet addresses (public).
 */
export async function GET() {
  return apiOk({
    btc: process.env.CRYPTO_BTC_ADDRESS ?? '',
    eth: process.env.CRYPTO_ETH_ADDRESS ?? '',
    usdt_erc20: process.env.CRYPTO_USDT_ERC20_ADDRESS ?? '',
    usdt_trc20: process.env.CRYPTO_USDT_TRC20_ADDRESS ?? '',
  })
}
