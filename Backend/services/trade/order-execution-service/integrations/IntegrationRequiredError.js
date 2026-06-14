'use strict';
/**
 * Shared error type for vendor-integration seams that have NOT been wired to a
 * real, certified external provider.
 *
 * `realAdapter.js` scaffolds throw this from every method. It is the single,
 * greppable signal that a code path requires a real integration before it can
 * run in production. It MUST never be swallowed silently — for fail-closed
 * domains (sanctions, customs) the caller must treat it as a hard block.
 */
class IntegrationRequiredError extends Error {
    /**
     * @param {string} message human-readable "<vendor> integration not configured"
     * @param {{ domain?: string, vendorOptions?: string[], cause?: Error }} [meta]
     */
    constructor(message, meta = {}) {
        super(message);
        this.name = 'IntegrationRequiredError';
        /** machine-readable code for catch-site routing */
        this.code = 'INTEGRATION_REQUIRED';
        /** which seam this came from, e.g. 'payment' | 'sanctions' | 'kyc' */
        this.domain = meta.domain || null;
        /** suggested real vendors for operators */
        this.vendorOptions = meta.vendorOptions || [];
        if (meta.cause) this.cause = meta.cause;
        // never production-safe by definition
        this.productionSafe = false;
        Error.captureStackTrace?.(this, IntegrationRequiredError);
    }
}

module.exports = { IntegrationRequiredError };
