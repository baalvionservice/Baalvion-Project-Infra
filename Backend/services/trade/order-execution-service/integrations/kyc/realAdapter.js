'use strict';
/**
 * ============================================================================
 * REAL KYC/IDV adapter — Onfido (API v3.6). PRODUCTION-SAFE.
 * ============================================================================
 * Implements the KycProvider contract (./contract.js) against Onfido. The
 * approval decision is FAIL-CLOSED: a counterparty is APPROVED only on an
 * explicit Onfido `approved` workflow-run status. A timeout on start surfaces
 * IntegrationTimeoutError (the check is in-flight; resolve it via getResult or
 * a webhook) and NEVER synthesizes an APPROVED.
 *
 * Required configuration (env / secret manager — NEVER hardcode, NEVER log):
 *   ONFIDO_API_TOKEN      required. Without it every method throws
 *                         IntegrationRequiredError (greppable not-configured signal).
 *   ONFIDO_REGION         eu | us | ca   (default eu) — data-residency host.
 *   ONFIDO_WORKFLOW_ID    Onfido Studio workflow id. When set, the modern
 *                         /workflow_runs path is used; when absent the adapter
 *                         falls back to the legacy /checks path.
 *   ONFIDO_WEBHOOK_TOKEN  HMAC key for X-SHA2-Signature on async callbacks
 *                         (see ./webhook.js).
 *
 * Compliance prerequisite (operator responsibility, not enforced in code):
 *   signed DPA, a compliance-approved verification workflow, per-jurisdiction
 *   data-residency (region), and retention of the verification audit trail. PII
 *   must never be logged.
 *
 * WIRING NOTE (NOT done now — supervised step):
 *   The order path would call startVerification(subject) to gate a counterparty
 *   BEFORE money moves, then block until getResult/webhook yields an explicit
 *   APPROVED. PENDING/REVIEW/RESUBMIT/REJECTED all hold the money leg. This
 *   adapter is the seam only; it is not yet wired into the order saga.
 */
const { IntegrationRequiredError } = require('../IntegrationRequiredError');
const { env } = require('../_shared/config');
const { createOnfidoProvider } = require('./providers/onfido');

const META = { domain: 'kyc', vendorOptions: ['Onfido', 'Persona', 'Sumsub', 'Jumio'] };

const REQUIRED = ['ONFIDO_API_TOKEN'];

/**
 * @param {Object} [deps]
 * @param {Record<string,string>} [deps.env]  env source (defaults to process.env)
 * @param {Function} [deps.http]              injectable httpClient.request (tests)
 * @param {typeof fetch} [deps.fetchImpl]     injectable fetch (tests)
 * @returns {import('./contract').KycProvider}
 */
function createRealKycProvider(deps = {}) {
    const source = deps.env || process.env;
    const apiToken = env('ONFIDO_API_TOKEN', source);

    // Lazily build the provider only when configured. The adapter object itself
    // is always returned (so IS_PRODUCTION_SAFE/name are inspectable), but every
    // method fails-closed with IntegrationRequiredError until the token exists.
    function provider() {
        if (!apiToken) {
            throw new IntegrationRequiredError(
                `Onfido KYC integration not configured (missing ${REQUIRED.join(', ')})`,
                META,
            );
        }
        return createOnfidoProvider({
            apiToken,
            region: env('ONFIDO_REGION', source) || 'eu',
            workflowId: env('ONFIDO_WORKFLOW_ID', source),
            webhookToken: env('ONFIDO_WEBHOOK_TOKEN', source),
            httpRequest: deps.http,
            fetchImpl: deps.fetchImpl,
        });
    }

    return {
        name: 'onfido',
        IS_PRODUCTION_SAFE: true,

        /**
         * @param {import('./contract').KycSubject} subject
         * @returns {Promise<import('./contract').KycResult>}
         */
        async startVerification(subject) {
            if (!subject || !subject.idempotencyKey) {
                throw new Error('startVerification: subject.idempotencyKey required');
            }
            // Propagates IntegrationTimeoutError on a slow create — the caller
            // must resolve via getResult/webhook, never assume APPROVED.
            return provider().startVerification(subject);
        },

        /**
         * @param {string} id
         * @param {{ tenantId?: string, idempotencyKey?: string, legacy?: boolean }} [opts]
         * @returns {Promise<import('./contract').KycResult>}
         */
        async getResult(id, opts = {}) {
            return provider().getResult(id, opts);
        },
    };
}

module.exports = { createRealKycProvider, META };
