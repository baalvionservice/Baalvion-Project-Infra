'use strict';
/**
 * Barrel export for the vendor-integration seams.
 *
 * ⚠️ NOT wired into the running order/payment path. This is an entry point for
 * tests and for the future, supervised wiring step only. Importing this module
 * has no side effects and starts nothing.
 */
const { IntegrationRequiredError } = require('./IntegrationRequiredError');

const payment = {
    contract: require('./payment/contract'),
    mockAdapter: require('./payment/mockAdapter'),
    realAdapter: require('./payment/realAdapter'),
};
const sanctions = {
    contract: require('./sanctions/contract'),
    mockAdapter: require('./sanctions/mockAdapter'),
    realAdapter: require('./sanctions/realAdapter'),
};
const kyc = {
    contract: require('./kyc/contract'),
    mockAdapter: require('./kyc/mockAdapter'),
    realAdapter: require('./kyc/realAdapter'),
};
const customs = {
    contract: require('./customs/contract'),
    mockAdapter: require('./customs/mockAdapter'),
    realAdapter: require('./customs/realAdapter'),
};
const carrier = {
    contract: require('./carrier/contract'),
    mockAdapter: require('./carrier/mockAdapter'),
    realAdapter: require('./carrier/realAdapter'),
};
const ebl = {
    contract: require('./ebl/contract'),
    mockAdapter: require('./ebl/mockAdapter'),
    realAdapter: require('./ebl/realAdapter'),
};

module.exports = {
    IntegrationRequiredError,
    payment,
    sanctions,
    kyc,
    customs,
    carrier,
    ebl,
};
