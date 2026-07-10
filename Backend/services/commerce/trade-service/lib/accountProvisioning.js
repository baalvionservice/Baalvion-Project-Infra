'use strict';
/**
 * Lazily provisions the account-service (financial-services-java) ledger account an org needs
 * before it can be the source or beneficiary of an escrow hold. account-service has no concept
 * of a GTI organization (accounts are tenant-scoped UUIDs only), so trade-service is the one
 * place that remembers "org X's ledger account is Y" (trade.organizations.ledger_account_id,
 * migration 043).
 */
const { AppError } = require('../utils/errors');
const financeClient = require('./financeClient');

/**
 * Returns the org's account-service account UUID, creating it on first use.
 * Concurrent first-use races are safe: a duplicate account-service account may be created, but
 * the later write of `ledger_account_id` simply wins (last-write) and the row is not user-facing
 * money — it starts at a zero balance either way. Escrow correctness does not depend on this race.
 */
async function getOrCreateLedgerAccount(org, ctx = {}) {
    if (org.ledger_account_id) return org.ledger_account_id;
    if (!financeClient.enabled()) {
        throw new AppError('FINANCE_UNAVAILABLE', 'Finance suite is not enabled (FINANCE_ENABLED=false)', 503);
    }
    const account = await financeClient.createAccount({
        accountName: org.name,
        accountType: 'BUSINESS',
        currency: ctx.currency || 'USD',
        metadata: { orgId: org.id, orgCode: org.code },
    }, ctx);
    const accountId = account && account.id;
    if (!accountId) {
        throw new AppError('FINANCE_UNAVAILABLE', 'account-service did not return an account id', 502);
    }
    await org.update({ ledger_account_id: accountId });
    return accountId;
}

module.exports = { getOrCreateLedgerAccount };
