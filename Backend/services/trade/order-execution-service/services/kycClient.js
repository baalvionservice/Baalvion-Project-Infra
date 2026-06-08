'use strict';
/**
 * KYC/IDV status client for the order-placement gate. Resolves a counterparty's KYC
 * verification result via the real provider adapter (Onfido by default).
 *
 * FAIL-CLOSED: an unreachable provider or an unconfigured adapter THROWS, so the gate
 * blocks the order (a counterparty is only treated as verified on an explicit APPROVED).
 */
const config = require('../config/appConfig');

let _kyc = null;
function kycProvider() {
    if (!_kyc) {
        _kyc = require('../integrations/kyc/realAdapter').createRealKycProvider();
    }
    return _kyc;
}

/**
 * @param {{ kycId:string, tenantId?:string }} args
 * @param {{ provider?:string, adapter?:object }} [opts]  injection for tests
 * @returns {Promise<import('../integrations/kyc/contract').KycResult>}
 */
async function getStatus({ kycId, tenantId }, opts = {}) {
    const adapter = opts.adapter || kycProvider();
    return adapter.getResult(kycId, { tenantId });
}

module.exports = { getStatus, provider: () => config.kyc.provider };
