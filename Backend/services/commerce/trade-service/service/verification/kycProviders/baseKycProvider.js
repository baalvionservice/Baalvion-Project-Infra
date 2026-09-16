'use strict';
/**
 * KycProvider — the BASE INTERFACE every third-party KYC/KYB vendor integration
 * extends. Mirrors service/freight/connectors/baseConnector.js's shape deliberately:
 * one abstract interface, a pluggable registry (./index.js), concrete vendor
 * adapters supply only the vendor-specific wire calls.
 *
 *   submitIdentity(applicant)   → { externalRef }   send a person's doc+selfie for checking
 *   submitCompany(company)      → { externalRef }   send a business registration for checking
 *   parseWebhookVerdict(payload, headers, rawBody) → { externalRef, kind, decision, reason }
 *                                    verify the signature over the RAW bytes (a re-serialized
 *                                    body will not match) + normalize the vendor's callback
 *
 * NOTE ON HONESTY: unlike the freight carrier connectors, there is deliberately NO
 * simulator/demo-mode fallback here that fabricates a pass/fail verdict. A simulated
 * shipping quote is a harmless placeholder number; a simulated "identity verified"
 * is a false compliance claim. With no real provider registered, submissions stay on
 * the existing 100%-human review path (identityVerificationController.js /
 * companyVerificationController.js) — never a fake auto-decision.
 */
class KycProvider {
    constructor(opts = {}) {
        if (new.target === KycProvider) {
            throw new Error('KycProvider is abstract — extend it with a concrete vendor adapter');
        }
        this.name = opts.name || 'unknown';
    }

    // eslint-disable-next-line no-unused-vars, class-methods-use-this
    async submitIdentity(applicant) { throw new Error('submitIdentity() not implemented'); }

    // eslint-disable-next-line no-unused-vars, class-methods-use-this
    async submitCompany(company) { throw new Error('submitCompany() not implemented'); }

    // eslint-disable-next-line no-unused-vars, class-methods-use-this
    parseWebhookVerdict(payload, headers, rawBody) { throw new Error('parseWebhookVerdict() not implemented'); }
}

module.exports = { KycProvider };
