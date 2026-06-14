'use strict';
/**
 * ============================================================================
 * CUSTOMS BROKER / SINGLE-WINDOW — integration contract
 * ============================================================================
 * Seam point: contract-only in order-execution-service today. Real customs
 * filing happens through a licensed broker / single-window. This boundary lets
 * the order/logistics path request a declaration without any in-repo code ever
 * performing the legal act of filing.
 *
 * Real vendor = Descartes / e2open, or direct national single-windows:
 *   US ACE/ABI, EU ICS2, UK CDS, India ICEGATE.
 *
 * ⚠️ LEGAL NOTICE: filing a customs declaration is a LEGAL ACT with statutory
 * liability for the declarant. NO mock and NO un-certified adapter may ever
 * submit a real declaration. `submitDeclaration` on any non-production adapter
 * MUST refuse loudly.
 *
 * POSTURE: FAIL-CLOSED — a shipment is only "declared/cleared" on an explicit
 * confirmation from the real broker/single-window. Never infer clearance.
 */

/**
 * @readonly
 * @enum {string}
 */
const DECLARATION_STATUS = Object.freeze({
    DRAFT: 'DRAFT',
    /** Validated locally, not yet lodged with the authority. */
    VALIDATED: 'VALIDATED',
    /** Lodged with the customs authority, awaiting decision. */
    SUBMITTED: 'SUBMITTED',
    /** Authority accepted the declaration. */
    ACCEPTED: 'ACCEPTED',
    /** Goods released / cleared. */
    CLEARED: 'CLEARED',
    /** Held for inspection / query. */
    HELD: 'HELD',
    /** Rejected by the authority. */
    REJECTED: 'REJECTED',
});

const TERMINAL_STATUSES = Object.freeze(['CLEARED', 'REJECTED']);

/**
 * @typedef {Object} DeclarationLine
 * @property {string} hsCode      Harmonized System tariff code
 * @property {string} description
 * @property {number} quantity
 * @property {number} value
 * @property {string} currency
 * @property {string} originCountry ISO-3166 alpha-2
 */

/**
 * @typedef {Object} DeclarationRequest
 * @property {string} idempotencyKey
 * @property {string} regime        'IMPORT' | 'EXPORT' | 'TRANSIT'
 * @property {string} declarantId   the legally responsible declarant
 * @property {string} destinationCountry
 * @property {string} portOfEntry
 * @property {DeclarationLine[]} lines
 * @property {string} [tenantId]
 */

/**
 * @typedef {Object} DeclarationResult
 * @property {string} id
 * @property {string} idempotencyKey
 * @property {keyof typeof DECLARATION_STATUS} status
 * @property {string} [mrn]         Movement Reference Number from the authority
 * @property {string[]} [notices]   broker/authority messages
 */

/**
 * @typedef {Object} CustomsProvider
 * @property {string} name
 * @property {boolean} IS_PRODUCTION_SAFE
 * @property {(req: DeclarationRequest) => Promise<DeclarationResult>} validateDeclaration
 *   Local validation only — safe for any adapter, never lodges.
 * @property {(req: DeclarationRequest) => Promise<DeclarationResult>} submitDeclaration
 *   ⚠️ LEGAL ACT — lodges with the authority. Only a certified production adapter
 *   may implement this; all others MUST throw.
 * @property {(id: string, opts?: {tenantId?: string}) => Promise<DeclarationResult>} getStatus
 */

/**
 * @readonly
 */
const FAILURE_MODES = Object.freeze({
    TIMEOUT: 'Single-window responses can be slow/async. A timeout on submit means the lodgement state is UNKNOWN — resolve via getStatus, never re-submit blindly (double-filing is a legal/financial error).',
    IDEMPOTENCY: 'submitDeclaration MUST be idempotent on idempotencyKey so a retry cannot lodge a second declaration.',
    PARTIAL: 'SUBMITTED/HELD are non-terminal; clearance (CLEARED) or REJECTED is terminal and comes from the authority.',
    POSTURE: 'FAIL-CLOSED and LEGALLY GUARDED — only a certified production adapter may file; no mock may ever submit a real declaration.',
});

module.exports = { DECLARATION_STATUS, TERMINAL_STATUSES, FAILURE_MODES };
