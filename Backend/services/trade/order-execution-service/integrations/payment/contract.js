'use strict';
/**
 * ============================================================================
 * PSP / PAYMENT RAIL — integration contract
 * ============================================================================
 * Seam point today: `services/paymentClient.js` (POST /api/v1/payments/initiate
 * to the internal payment-service) + `workers/paymentSimulator.js` (emits a
 * terminal payments.transaction.completed onto the bus). Both are INTERNAL /
 * SIMULATED — they move ledger numbers, not real money.
 *
 * Real vendor = a LICENSED PSP / BaaS that actually moves funds and routes onto
 * regulated rails: Stripe Treasury, Nium, Currencycloud, Airwallex (also SWIFT /
 * SEPA / ACH / UPI / Pix / M-Pesa rail routing). Settlement of real money is a
 * REGULATED act; no in-repo code may originate a real transfer.
 *
 * This module defines the provider interface the order hot-path needs, the
 * request/response shapes, the normalized status enum, and the failure posture.
 * It contains NO behavior — only types and constants.
 */

/**
 * Normalized payment status enum. Every adapter MUST map its vendor-specific
 * statuses onto exactly these values. The order saga reasons over these only.
 * @readonly
 * @enum {string}
 */
const PAYMENT_STATUS = Object.freeze({
    /** Accepted by the rail, not yet settled. */
    PENDING: 'PENDING',
    /** Submitted to the underlying rail / network. */
    PROCESSING: 'PROCESSING',
    /** Funds settled — terminal success. */
    COMPLETED: 'COMPLETED',
    /** Rejected/failed by rail — terminal failure. */
    FAILED: 'FAILED',
    /** Cancelled before settlement — terminal. */
    CANCELLED: 'CANCELLED',
    /** Held for review (AML/compliance) — non-terminal, may resolve later. */
    HELD: 'HELD',
});

/** Terminal statuses — no further transition expected. */
const TERMINAL_STATUSES = Object.freeze(['COMPLETED', 'FAILED', 'CANCELLED']);

/**
 * Supported payment rail / scheme identifiers (routing seam). A real adapter
 * selects the rail per corridor + currency; the mock accepts but does not route.
 * @readonly
 * @enum {string}
 */
const PAYMENT_RAIL = Object.freeze({
    SWIFT: 'SWIFT',
    SEPA: 'SEPA',
    ACH: 'ACH',
    UPI: 'UPI',
    PIX: 'Pix',
    MPESA: 'M-Pesa',
    /** internal ledger transfer — the current simulated path */
    INTERNAL: 'INTERNAL',
});

/**
 * @typedef {Object} PaymentInitiateRequest
 * @property {string} idempotencyKey  caller-supplied; same key MUST return the
 *   same payment, never double-charge. Matches paymentClient.js semantics.
 * @property {string} sourceAccountId
 * @property {string} destinationAccountId
 * @property {number} amount           minor-unit-safe decimal (see vendor docs)
 * @property {string} currency         ISO-4217
 * @property {string} [paymentScheme]  one of PAYMENT_RAIL; defaults INTERNAL
 * @property {string} [tenantId]       UUID; forwarded as X-Tenant-ID upstream
 * @property {Object} [metadata]       free-form correlation (orderId, traceId)
 */

/**
 * @typedef {Object} PaymentResult
 * @property {string} id               provider payment id
 * @property {string} idempotencyKey   echoed back
 * @property {keyof typeof PAYMENT_STATUS} status
 * @property {number} amount
 * @property {string} currency
 * @property {string} [rail]           one of PAYMENT_RAIL actually used
 * @property {string} [providerRef]    external rail reference (UETR/end-to-end id)
 * @property {string} [failureReason]  present iff status === FAILED
 */

/**
 * The interface every payment adapter must implement.
 * @typedef {Object} PaymentProvider
 * @property {string} name
 * @property {boolean} IS_PRODUCTION_SAFE
 * @property {(req: PaymentInitiateRequest) => Promise<PaymentResult>} initiate
 *   Idempotent on idempotencyKey. Mirrors paymentClient.initiate().
 * @property {(id: string, opts?: {tenantId?: string}) => Promise<PaymentResult>} getStatus
 *   Poll a payment by provider id.
 * @property {(id: string, opts?: {idempotencyKey: string, tenantId?: string}) => Promise<PaymentResult>} cancel
 *   Best-effort cancel; only valid on non-terminal payments.
 */

/**
 * Documented failure modes + required posture. Payments are FAIL-CLOSED on the
 * authorization decision (never assume success on timeout) but the *settlement*
 * is asynchronous — a timeout means UNKNOWN, resolve via getStatus + webhook,
 * NEVER by re-initiating without the same idempotencyKey.
 * @readonly
 */
const FAILURE_MODES = Object.freeze({
    /** Network/timeout on initiate => status UNKNOWN. Do NOT retry with a new key. */
    TIMEOUT: 'On timeout the payment may or may not have been accepted. Reconcile via getStatus(id) or the inbound webhook using the SAME idempotencyKey. Never re-initiate with a fresh key.',
    /** Same idempotencyKey must yield the same PaymentResult, no double-spend. */
    IDEMPOTENCY: 'initiate() MUST be idempotent on idempotencyKey: a replay returns the original payment, it does not create a second transfer.',
    /** Rail accepted but settlement pending — partial/async completion. */
    PARTIAL: 'A non-terminal status (PENDING/PROCESSING/HELD) is normal; completion arrives asynchronously via webhook/poll, not from the initiate response.',
    /** Posture: fail-closed on the money decision. */
    POSTURE: 'FAIL-CLOSED on authorization — a payment is COMPLETED only on an explicit terminal success from the provider; absence of confirmation is treated as not-paid.',
});

module.exports = {
    PAYMENT_STATUS,
    TERMINAL_STATUSES,
    PAYMENT_RAIL,
    FAILURE_MODES,
};
