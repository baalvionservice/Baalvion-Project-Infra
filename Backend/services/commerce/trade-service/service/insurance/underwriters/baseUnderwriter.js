'use strict';
/**
 * UnderwriterAdapter — the BASE INTERFACE every carrier/MGA integration extends.
 * Same shape as service/verification/kycProviders/baseKycProvider.js and
 * service/freight/connectors/baseConnector.js: one abstract interface, a registry,
 * concrete adapters supply only the vendor-specific wire calls.
 *
 *   quote(risk)            → { premiumRate, premium, deductible, terms, declined, reason }
 *                            the carrier's OWN price for this risk
 *   bind(risk, quote)      → { policyRef, effectiveFrom, effectiveTo, terms }
 *                            place the risk on their paper; policyRef is THEIR number
 *   notifyClaim(claim)     → { claimRef }            first advice of loss
 *   settleClaim(claim)     → { settledAmount, settledAt, reference }
 *
 * NO SIMULATOR FALLBACK, for the same reason the KYC layer has none: a made-up
 * freight quote is a placeholder number, but a made-up "this risk is on Allianz
 * paper" is a false statement about who owes the money after a total loss. With no
 * adapter registered, `manual` is used — quotes and bindings are exchanged out of
 * band by a human and recorded, which is exactly how a real binder starts life.
 */
class UnderwriterAdapter {
    constructor(opts = {}) {
        if (new.target === UnderwriterAdapter) {
            throw new Error('UnderwriterAdapter is abstract — extend it with a concrete carrier adapter');
        }
        this.name = opts.name || 'unknown';
        this.underwriter = opts.underwriter || null;
    }

    // eslint-disable-next-line no-unused-vars, class-methods-use-this
    async quote(risk) { throw new Error('quote() not implemented'); }

    // eslint-disable-next-line no-unused-vars, class-methods-use-this
    async bind(risk, quote) { throw new Error('bind() not implemented'); }

    // eslint-disable-next-line no-unused-vars, class-methods-use-this
    async notifyClaim(claim) { throw new Error('notifyClaim() not implemented'); }

    // eslint-disable-next-line no-unused-vars, class-methods-use-this
    async settleClaim(claim) { throw new Error('settleClaim() not implemented'); }
}

/**
 * The out-of-band relationship: the platform prices from its own rating engine and
 * binds under the delegated authority, and the carrier's policy number is recorded
 * when their confirmation arrives. This is a REAL working mode for a binder — not a
 * simulation — which is why it is the default and why it never invents a carrier
 * reference it has not been given.
 */
class ManualUnderwriter extends UnderwriterAdapter {
    constructor(opts = {}) { super({ ...opts, name: 'manual' }); }

    // Under a binding authority the platform IS authorised to price and bind, so a
    // manual binder does not decline — capacity is enforced by placement.js.
    // eslint-disable-next-line class-methods-use-this
    async quote() { return { declined: false, useOwnRating: true }; }

    // eslint-disable-next-line class-methods-use-this
    async bind() { return { policyRef: null, pendingCarrierConfirmation: true }; }

    // eslint-disable-next-line class-methods-use-this
    async notifyClaim() { return { claimRef: null, pendingCarrierConfirmation: true }; }

    // eslint-disable-next-line class-methods-use-this
    async settleClaim() { return { settledAmount: null, pendingCarrierConfirmation: true }; }
}

module.exports = { UnderwriterAdapter, ManualUnderwriter };
