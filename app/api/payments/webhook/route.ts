/**
 * POST /api/payments/webhook — Paystack webhook endpoint.
 * Paystack sends payment events here. This route delegates to the main
 * payments handler which verifies HMAC-SHA512 signatures and confirms orders.
 */
export { POST } from '../route'
