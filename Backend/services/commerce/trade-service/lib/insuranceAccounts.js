'use strict';
/**
 * Resolves the two ledger accounts an insurance money movement needs.
 *
 * PRE-EXISTING BUG this fixes: insuranceController called financeClient.initiatePayment
 * with no sourceAccountId/destinationAccountId, so payment-service rejected every
 * premium charge and every claim payout with "Source account required" — the whole
 * insurance money path was inert whenever FINANCE_ENABLED=true. Escrow already had
 * the right pattern (lib/accountProvisioning.js); insurance simply never used it.
 *
 * Premium: assured → underwriter. Payout and general average: underwriter → assured.
 *
 * The underwriter is a real organization row (type 'insurer') rather than a magic
 * constant, so its ledger account is provisioned, stored and audited exactly like
 * any counterparty's. Set INSURANCE_UNDERWRITER_ACCOUNT_ID to point at an external
 * carrier's account instead once cover is placed with a real market.
 */
const db = require('../models');
const config = require('../config/appConfig');
const { getOrCreateLedgerAccount } = require('./accountProvisioning');
const { AppError } = require('../utils/errors');

const UNDERWRITER_CODE = 'BAALVION-UNDERWRITING';
// Client money. Premium collected on a 'trust' binder belongs to the carrier from
// the moment the assured pays it, and in most jurisdictions must be held apart from
// operating funds. This is that account — separate from the platform's own book, and
// the reason commission is DRAWN from it afterwards rather than netted at the door.
const TRUST_CODE = 'BAALVION-PREMIUM-TRUST';

function financeCtx(req) {
    return {
        tenantId: req && req.tenantId,
        bearer: ((req && req.headers && req.headers.authorization) || '').split(' ')[1] || undefined,
    };
}

/** The book the premium is paid into and claims are paid out of. */
async function underwriterAccountId(req) {
    const configured = config.finance.insuranceUnderwriterAccountId;
    if (configured) return configured;

    let org = await db.Organization.findOne({ where: { code: UNDERWRITER_CODE } });
    if (!org) {
        org = await db.Organization.create({
            code: UNDERWRITER_CODE,
            name: 'Baalvion Cargo Underwriting',
            legal_name: 'Baalvion Cargo Underwriting',
            org_type: 'insurer',
            status: 'active',
            // Platform-level counterparty, not a customer tenant. trade.organizations
            // carries no RLS policy (migration 007 does not list it), so this row is
            // readable from any tenant's request — which is what a shared counterparty
            // has to be.
            tenant_id: 'PLATFORM',
        });
    }
    // A single total loss on a mid-size container can exceed account-service's
    // 1,000,000/day retail default, which then rejects the payout outright.
    return getOrCreateLedgerAccount(org, { ...financeCtx(req), dailyLimit: config.finance.insuranceUnderwriterDailyLimit });
}

/**
 * The segregated client-money (IBA) account gross premium is collected into.
 *
 * Set INSURANCE_TRUST_ACCOUNT_ID to point at a genuinely ring-fenced bank account.
 * Until that is done this provisions a distinct ledger account, which separates the
 * money in the books but is NOT legal segregation — the difference matters to a
 * regulator and is surfaced in the API rather than glossed over.
 */
async function trustAccountId(req) {
    if (config.finance.insuranceTrustAccountId) return config.finance.insuranceTrustAccountId;

    let org = await db.Organization.findOne({ where: { code: TRUST_CODE } });
    if (!org) {
        org = await db.Organization.create({
            code: TRUST_CODE,
            name: 'Baalvion Premium Trust (client money)',
            legal_name: 'Baalvion Premium Trust',
            org_type: 'bank',
            status: 'active',
            tenant_id: 'PLATFORM',
        });
    }
    return getOrCreateLedgerAccount(org, { ...financeCtx(req), dailyLimit: config.finance.insuranceUnderwriterDailyLimit });
}

/** Is the trust account a real ring-fenced one, or the internal stand-in? */
const trustIsSegregated = () => Boolean(config.finance.insuranceTrustAccountId);

/** The assured's own ledger account, resolved from the tenant that owns the policy. */
async function assuredAccountId(req, policy) {
    const tenantId = (policy && policy.tenant_id) || (req.auth && (req.auth.tenantId || req.auth.orgId));
    if (!tenantId) {
        throw new AppError('NO_ASSURED_ACCOUNT', 'cannot identify the assured organization for this policy', 409);
    }
    const org = await db.Organization.findOne({ where: { tenant_id: tenantId }, order: [['id', 'ASC']] });
    if (!org) {
        throw new AppError('NO_ASSURED_ACCOUNT', 'the assured has no organization on this platform — complete company verification first', 409);
    }
    return getOrCreateLedgerAccount(org, financeCtx(req));
}

/**
 * The account the risk-carrying underwriter is paid into / paid out of.
 *
 * A policy placed on a carrier's binder (migration 071) settles against THAT
 * carrier's account — the whole point of placing the risk is that their balance
 * sheet carries it. Only an unplaced, platform-retained policy falls back to the
 * platform's own book.
 */
async function carrierAccountId(req, policy) {
    if (policy && policy.underwriter_id) {
        const uw = await db.InsuranceUnderwriter.findByPk(policy.underwriter_id);
        if (uw && uw.ledger_account_id) return uw.ledger_account_id;
        if (uw) {
            throw new AppError(
                'UNDERWRITER_NO_ACCOUNT',
                `underwriter ${uw.name} has no ledger account — premium cannot be remitted to it`,
                409,
            );
        }
    }
    return underwriterAccountId(req);
}

/**
 * @param {'premium'|'payout'} direction
 * @returns {{sourceAccountId:string, destinationAccountId:string}}
 */
async function accountsFor(direction, req, policy) {
    const [assured, carrier] = await Promise.all([assuredAccountId(req, policy), carrierAccountId(req, policy)]);
    return direction === 'premium'
        ? { sourceAccountId: assured, destinationAccountId: carrier }
        : { sourceAccountId: carrier, destinationAccountId: assured };
}

/**
 * The client-money route for a 'trust' binder, in the order it legally happens:
 *   1. assured  → trust      the GROSS premium, which is the carrier's money
 *   2. trust    → carrier    the net remittance
 *   3. trust    → platform   the commission, DRAWN once earned
 *
 * Netting the commission at step 1 would mean the broker never held the carrier's
 * full premium, which is precisely what client-money rules exist to prevent.
 */
async function trustFlow(req, policy) {
    const [assured, carrier, trust] = await Promise.all([
        assuredAccountId(req, policy),
        carrierAccountId(req, policy),
        trustAccountId(req),
    ]);
    return {
        collect: { sourceAccountId: assured, destinationAccountId: trust },
        remit: { sourceAccountId: trust, destinationAccountId: carrier },
        drawCommission: { sourceAccountId: trust, destinationAccountId: await underwriterAccountId(req) },
        trustAccountId: trust,
        segregated: trustIsSegregated(),
    };
}

module.exports = {
    accountsFor, trustFlow, trustAccountId, trustIsSegregated,
    assuredAccountId, underwriterAccountId, carrierAccountId,
    UNDERWRITER_CODE, TRUST_CODE,
};
