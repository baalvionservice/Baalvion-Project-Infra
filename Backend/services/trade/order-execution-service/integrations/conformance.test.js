'use strict';
/**
 * Aggregate conformance: runs every domain's reusable suite against its DEV mock
 * adapter with { productionSafe: false }. A future real adapter reuses the same
 * runConformanceSuite export with { productionSafe: true } once certified.
 */
const payment = require('./payment/conformance.test');
const sanctions = require('./sanctions/conformance.test');
const kyc = require('./kyc/conformance.test');
const customs = require('./customs/conformance.test');
const carrier = require('./carrier/conformance.test');
const ebl = require('./ebl/conformance.test');

const { createMockPaymentProvider } = require('./payment/mockAdapter');
const { createMockSanctionsProvider } = require('./sanctions/mockAdapter');
const { createMockKycProvider } = require('./kyc/mockAdapter');
const { createMockCustomsProvider } = require('./customs/mockAdapter');
const { createMockCarrierProvider } = require('./carrier/mockAdapter');
const { createMockEblProvider } = require('./ebl/mockAdapter');

describe('integrations — all-domain mock conformance', () => {
    payment.runConformanceSuite(() => createMockPaymentProvider(), { productionSafe: false });
    sanctions.runConformanceSuite(() => createMockSanctionsProvider(), { productionSafe: false });
    kyc.runConformanceSuite(() => createMockKycProvider(), { productionSafe: false });
    customs.runConformanceSuite(() => createMockCustomsProvider(), { productionSafe: false });
    carrier.runConformanceSuite(() => createMockCarrierProvider(), { productionSafe: false });
    ebl.runConformanceSuite(() => createMockEblProvider(), { productionSafe: false });
});
