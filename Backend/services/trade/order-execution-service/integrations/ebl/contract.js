'use strict';
/**
 * ============================================================================
 * e-BILL OF LADING REGISTRY (eB/L) — integration contract
 * ============================================================================
 * Seam point: contract-only here. An electronic Bill of Lading is a NEGOTIABLE
 * INSTRUMENT (document of title). Title transfer is only legally effective on an
 * MLETR-compliant registry that guarantees singularity, control, and integrity.
 *
 * Real vendor = WaveBL, essDOCS/Bolero (MLETR-compliant eB/L platforms).
 *
 * ⚠️ LEGAL NOTICE: a generated PDF is NOT a negotiable instrument. Issuing or
 * endorsing/transferring title is a legal act. NO mock and NO un-certified
 * adapter may ever "issue" or "transfer" a real eB/L — those methods MUST refuse
 * loudly on non-production adapters.
 *
 * POSTURE: FAIL-CLOSED — title is only considered issued/transferred on explicit
 * confirmation from the registry. Never infer possession of title.
 */

/**
 * @readonly
 * @enum {string}
 */
const EBL_STATUS = Object.freeze({
    DRAFT: 'DRAFT',
    /** Issued onto the registry — a live document of title. */
    ISSUED: 'ISSUED',
    /** Endorsed/transferred to a new holder. */
    TRANSFERRED: 'TRANSFERRED',
    /** Surrendered to the carrier (release of goods). */
    SURRENDERED: 'SURRENDERED',
    /** Voided. */
    VOID: 'VOID',
});

const TERMINAL_STATUSES = Object.freeze(['SURRENDERED', 'VOID']);

/**
 * @typedef {Object} EblIssueRequest
 * @property {string} idempotencyKey
 * @property {string} shipperId
 * @property {string} consigneeId
 * @property {string} carrierId
 * @property {string} portOfLoading
 * @property {string} portOfDischarge
 * @property {Object} cargo        description, weight, container ids
 * @property {string} [tenantId]
 */

/**
 * @typedef {Object} EblResult
 * @property {string} id            registry document id (the title reference)
 * @property {string} idempotencyKey
 * @property {keyof typeof EBL_STATUS} status
 * @property {string} [currentHolderId}
 * @property {string} [registry]    e.g. 'WaveBL' | 'Bolero'
 */

/**
 * @typedef {Object} EblProvider
 * @property {string} name
 * @property {boolean} IS_PRODUCTION_SAFE
 * @property {(req: EblIssueRequest) => Promise<EblResult>} issue
 *   ⚠️ LEGAL ACT — creates a document of title on the registry. Only a certified
 *   production adapter may implement; all others MUST throw.
 * @property {(args: {id: string, toHolderId: string, idempotencyKey: string, tenantId?: string}) => Promise<EblResult>} transfer
 *   ⚠️ LEGAL ACT — endorses title to a new holder. Same restriction.
 * @property {(id: string, opts?: {tenantId?: string}) => Promise<EblResult>} getStatus
 */

/**
 * @readonly
 */
const FAILURE_MODES = Object.freeze({
    TIMEOUT: 'On timeout during issue/transfer the registry state is UNKNOWN — resolve via getStatus, never re-issue/re-transfer blindly (a second title or double-endorsement is a legal defect).',
    IDEMPOTENCY: 'issue/transfer MUST be idempotent on idempotencyKey to preserve singularity (exactly one authoritative title).',
    PARTIAL: 'ISSUED/TRANSFERRED are live states; SURRENDERED/VOID are terminal. Control must always rest with exactly one holder.',
    POSTURE: 'FAIL-CLOSED and LEGALLY GUARDED — only a certified MLETR-compliant registry adapter may issue/transfer title; a PDF is not a negotiable instrument.',
});

module.exports = { EBL_STATUS, TERMINAL_STATUSES, FAILURE_MODES };
