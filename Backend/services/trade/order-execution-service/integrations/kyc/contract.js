'use strict';
/**
 * ============================================================================
 * KYC / IDV (identity verification) — integration contract
 * ============================================================================
 * Seam point: no live seam in order-execution-service today — onboarding/KYC
 * lives in the Java account-service. This contract is CONTRACT-ONLY: it defines
 * the boundary the order path would call to gate a counterparty before money
 * moves, so a real adapter can be slotted in under supervision.
 *
 * Real vendor = Onfido / Persona / Sumsub / Jumio (document + biometric IDV,
 * watchlist/PEP, ongoing monitoring).
 *
 * POSTURE: FAIL-CLOSED for the approval decision — a subject is APPROVED only on
 * an explicit verified result; timeout/unknown = not approved.
 */

/**
 * @readonly
 * @enum {string}
 */
const KYC_STATUS = Object.freeze({
    /** No check started. */
    NOT_STARTED: 'NOT_STARTED',
    /** Submitted, awaiting provider decision (async). */
    PENDING: 'PENDING',
    /** Identity verified. */
    APPROVED: 'APPROVED',
    /** Verification failed / fraud signal. */
    REJECTED: 'REJECTED',
    /** Needs manual review. */
    REVIEW: 'REVIEW',
    /** Provider requires more documents/info. */
    RESUBMIT: 'RESUBMIT',
});

const TERMINAL_STATUSES = Object.freeze(['APPROVED', 'REJECTED']);

/**
 * @typedef {Object} KycSubject
 * @property {string} idempotencyKey
 * @property {string} type        'INDIVIDUAL' | 'BUSINESS'
 * @property {string} [fullName]
 * @property {string} [legalName]
 * @property {string} [country]   ISO-3166 alpha-2
 * @property {string} [externalRef] caller correlation (counterparty id)
 * @property {string} [tenantId]
 */

/**
 * @typedef {Object} KycResult
 * @property {string} id            provider verification id
 * @property {string} idempotencyKey
 * @property {keyof typeof KYC_STATUS} status
 * @property {string[]} [reasons]   rejection / review reason codes
 * @property {string} [providerRef]
 */

/**
 * @typedef {Object} KycProvider
 * @property {string} name
 * @property {boolean} IS_PRODUCTION_SAFE
 * @property {(subject: KycSubject) => Promise<KycResult>} startVerification
 *   Idempotent on idempotencyKey. Often async — initial status may be PENDING.
 * @property {(id: string, opts?: {tenantId?: string}) => Promise<KycResult>} getResult
 */

/**
 * @readonly
 */
const FAILURE_MODES = Object.freeze({
    TIMEOUT: 'Verification is asynchronous; a timeout on start means the check may be in-flight — resolve via getResult(id) or webhook, never assume APPROVED.',
    IDEMPOTENCY: 'startVerification MUST be idempotent on idempotencyKey to avoid duplicate KYC checks (cost + audit duplication).',
    PARTIAL: 'PENDING/REVIEW/RESUBMIT are normal non-terminal states; only APPROVED/REJECTED are terminal.',
    POSTURE: 'FAIL-CLOSED — a counterparty is only treated as verified on an explicit APPROVED; absence of a decision is not approval.',
});

module.exports = { KYC_STATUS, TERMINAL_STATUSES, FAILURE_MODES };
