/**
 * POST /api/payments/crypto/confirm
 * User submits their TX hash after paying crypto.
 * Body: { orderId, txHash, coin }
 */
import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { orders } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { and, eq, sql } from 'drizzle-orm'
import { getStoreSettings } from '@/lib/server/store-settings'
import { toPublicStoreConfig } from '@/lib/store-settings'

/** Validate crypto transaction hash format per coin */
function validateTxHash(txHash: string, coin: string): boolean {
  const hash = txHash.trim()
  switch (coin.toLowerCase()) {
    case 'btc':
      // Bitcoin TX hashes are 64 hex chars
      return /^[a-f0-9]{64}$/i.test(hash)
    case 'eth':
    case 'usdt_erc20':
      // Ethereum TX hashes are 66 chars (0x + 64 hex)
      return /^0x[a-f0-9]{64}$/i.test(hash)
    case 'usdt_trc20':
      // Tron TX hashes are 64 hex chars
      return /^[a-f0-9]{64}$/i.test(hash)
    default:
      return false
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req)
    if ('status' in auth) return auth
    const body = await req.json()
    const { orderId, txHash, coin } = body as { orderId: string; txHash: string; coin: string }

    if (!orderId || !txHash || !coin) return apiError('orderId, txHash and coin are required', 400)

    const validCoins = ['btc', 'eth', 'usdt_erc20', 'usdt_trc20']
    if (!validCoins.includes(coin.toLowerCase())) return apiError('Invalid coin', 400)

    const config = toPublicStoreConfig(await getStoreSettings())
    const coinEnabled = coin === 'btc' ? config.paymentMethods.btc
      : coin === 'eth' ? config.paymentMethods.eth
        : coin === 'usdt_trc20' ? config.paymentMethods.usdtTrc20
          : config.paymentMethods.usdtErc20
    if (!coinEnabled) return apiError('That crypto payment method is currently unavailable.', 422)

    if (!validateTxHash(txHash, coin)) {
      return apiError('Invalid transaction hash format for the selected coin', 400)
    }

    const [order] = await db.select({ id: orders.id, userId: orders.userId, paymentMethod: orders.paymentMethod, notes: orders.notes }).from(orders).where(eq(orders.id, orderId)).limit(1)
    if (!order) return apiError('Order not found', 404)
    if (order.userId !== auth.user.sub) return apiError('Forbidden', 403)
    if (order.paymentMethod !== 'crypto') return apiError('This order was not created for crypto payment.', 409)

    const [updated] = await db.update(orders)
      .set({
        paymentMethod: `crypto_${coin.toLowerCase()}`,
        paymentStatus: 'pending_verification',
        paymentRef: txHash,
        notes: order.notes ? `${order.notes}\nCrypto TX Hash: ${txHash}` : `Crypto TX Hash: ${txHash}`,
        updatedAt: new Date(),
      })
      .where(and(
        eq(orders.id, orderId),
        sql`${orders.paymentStatus} not in ('paid', 'pending_verification')`,
      ))
      .returning({ id: orders.id })

    if (!updated) {
      const [latest] = await db.select({ paymentStatus: orders.paymentStatus, paymentRef: orders.paymentRef })
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1)
      if (latest?.paymentStatus === 'paid') return apiError('Order already paid', 400)
      if (latest?.paymentStatus === 'pending_verification' && latest.paymentRef === txHash) {
        return apiOk({ message: 'Transaction hash already received. Your payment is awaiting verification.' })
      }
      if (latest?.paymentStatus === 'pending_verification') {
        return apiError('A different transaction hash has already been submitted for this order.', 409)
      }
      return apiError('Unable to submit transaction hash for this order. Please refresh and try again.', 409)
    }

    return apiOk({ message: 'Transaction hash received. Your payment will be verified within 1-30 minutes.' })
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
  const config = toPublicStoreConfig(await getStoreSettings())
  return apiOk({
    btc: config.paymentMethods.btc ? process.env.CRYPTO_BTC_ADDRESS ?? '' : '',
    eth: config.paymentMethods.eth ? process.env.CRYPTO_ETH_ADDRESS ?? '' : '',
    usdt_erc20: config.paymentMethods.usdtErc20 ? process.env.CRYPTO_USDT_ERC20_ADDRESS ?? '' : '',
    usdt_trc20: config.paymentMethods.usdtTrc20 ? process.env.CRYPTO_USDT_TRC20_ADDRESS ?? '' : '',
  })
}
