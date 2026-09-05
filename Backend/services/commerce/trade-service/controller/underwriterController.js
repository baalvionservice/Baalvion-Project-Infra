'use strict';
/**
 * Underwriters and binders (migration 071) — the carriers whose paper cover is
 * written on, and the delegated authority the platform holds on each.
 *
 * This is the operator surface for the broker relationship: record a binder when a
 * carrier appoints you, see how much of its capacity is consumed, and suspend it
 * when the authority lapses. Only platform operators may touch it — a binder is not
 * a customer record, and an org admin creating one would be granting themselves
 * capacity on someone else's balance sheet.
 */
const crypto = require('crypto');
const db = require('../models');
const placement = require('../service/insurance/placement');
const { supportedAdapters } = require('../service/insurance/underwriters');
const financeClient = require('../lib/financeClient');
const config = require('../config/appConfig');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

const uwId = () => `UW-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
const num = (x) => (x == null ? 0 : Number(x) || 0);

/**
 * Every bound binder needs an account to be remitted into, or the first policy
 * placed on it fails at payment time.
 *
 * A broker does not hold the carrier's own bank account — it holds premium in trust
 * and remits on a settlement cycle. So unless an explicit external account is given,
 * this provisions a PREMIUM-PAYABLE account on the platform's ledger representing
 * what is owed to that carrier; the periodic remittance out of it is a settlement
 * concern, not a per-policy one.
 */
async function ensureLedgerAccount(row, req) {
    if (row.ledger_account_id) return row.ledger_account_id;
    if (!config.finance.enabled) return null;
    const account = await financeClient.createAccount({
        accountName: `Premium payable — ${row.name}`,
        accountType: 'BUSINESS',
        currency: row.currency || 'USD',
        // Aggregate premium for a whole binder runs far past account-service's
        // 1,000,000/day retail default, which it cannot raise afterwards.
        dailyLimit: config.finance.insuranceUnderwriterDailyLimit,
        metadata: { underwriterId: row.id, binderReference: row.binder_reference, kind: 'premium_payable' },
    }, {
        tenantId: req && req.tenantId,
        bearer: ((req && req.headers && req.headers.authorization) || '').split(' ')[1] || undefined,
    });
    const id = account && account.id;
    if (!id) throw new AppError('FINANCE_UNAVAILABLE', 'account-service did not return an account id for this underwriter', 502);
    await row.update({ ledger_account_id: id });
    return id;
}

function toApi(r, capacity) {
    return {
        id: r.id, tenantId: r.tenant_id, name: r.name, legalEntity: r.legal_entity,
        adapter: r.adapter, binderReference: r.binder_reference, status: r.status,
        currency: r.currency,
        capacityLimit: r.capacity_limit != null ? num(r.capacity_limit) : null,
        perRiskLimit: r.per_risk_limit != null ? num(r.per_risk_limit) : null,
        commissionRate: Number(r.commission_rate),
        ledgerAccountId: r.ledger_account_id,
        binderStart: r.binder_start, binderEnd: r.binder_end,
        linesOfBusiness: r.lines_of_business,
        // Binder scope (migration 072) — the exclusions that actually void cover.
        territoriesIncluded: r.territories_included,
        territoriesExcluded: r.territories_excluded,
        commoditiesExcluded: r.commodities_excluded,
        premiumHandling: r.premium_handling,
        bindable: r.isBindable().ok,
        bindableReason: r.isBindable().reason,
        createdAt: r.created_at, updatedAt: r.updated_at,
        ...(capacity ? { capacity } : {}),
    };
}

const list = async (req, res, next) => {
    try {
        const where = {};
        if (req.query.status) where.status = req.query.status;
        const rows = await db.InsuranceUnderwriter.findAll({ where, order: [['created_at', 'ASC']], limit: 200 });
        const out = [];
        for (const r of rows) {
            const used = await placement.capacityUsed(r.id);
            const limit = r.capacity_limit != null ? num(r.capacity_limit) : null;
            out.push(toApi(r, {
                used,
                limit,
                remaining: limit == null ? null : Math.max(0, Math.round((limit - used) * 100) / 100),
                utilisation: limit ? Math.round((used / limit) * 10000) / 10000 : null,
            }));
        }
        return sendSuccess(req, res, out);
    } catch (err) { return next(err); }
};

const get = async (req, res, next) => {
    try {
        const r = await db.InsuranceUnderwriter.findByPk(req.params.id);
        if (!r) return next(new AppError('NOT_FOUND', 'Underwriter not found', 404));
        const used = await placement.capacityUsed(r.id);
        const limit = r.capacity_limit != null ? num(r.capacity_limit) : null;
        const policies = await db.InsurancePolicy.findAll({
            where: { underwriter_id: r.id }, order: [['created_at', 'DESC']], limit: 200,
        });
        return sendSuccess(req, res, {
            ...toApi(r, { used, limit, remaining: limit == null ? null : Math.max(0, limit - used), utilisation: limit ? used / limit : null }),
            policies: policies.map((p) => ({
                id: p.id, policyNumber: p.policy_number, status: p.status,
                coverageAmount: num(p.coverage_amount), premium: num(p.premium),
                commissionAmount: p.commission_amount != null ? num(p.commission_amount) : null,
                netPremium: p.net_premium != null ? num(p.net_premium) : null,
                underwriterPolicyRef: p.underwriter_policy_ref,
            })),
        });
    } catch (err) { return next(err); }
};

/** POST /insurance_underwriters — record a carrier relationship. */
const create = async (req, res, next) => {
    try {
        const b = req.body || {};
        if (!b.name) return next(new AppError('BAD_REQUEST', 'name is required', 400));

        const rate = b.commissionRate != null ? Number(b.commissionRate) : 0;
        if (!(rate >= 0 && rate <= 1)) {
            return next(new AppError('BAD_REQUEST', 'commissionRate is a fraction of gross premium between 0 and 1 (0.15 = 15%)', 400));
        }
        // A binder cannot be live without the agreement that creates it.
        if ((b.status === 'bound') && !b.binderReference) {
            return next(new AppError('BAD_REQUEST', 'a bound underwriter needs a binderReference — the binding authority agreement', 400));
        }

        const row = await db.InsuranceUnderwriter.create({
            id: b.id || uwId(),
            tenant_id: b.tenantId || null,
            name: b.name,
            legal_entity: b.legalEntity || null,
            adapter: b.adapter || 'manual',
            binder_reference: b.binderReference || null,
            status: b.status || 'prospective',
            currency: b.currency || 'USD',
            capacity_limit: b.capacityLimit != null ? Number(b.capacityLimit) : null,
            per_risk_limit: b.perRiskLimit != null ? Number(b.perRiskLimit) : null,
            commission_rate: rate,
            ledger_account_id: b.ledgerAccountId || null,
            binder_start: b.binderStart || null,
            binder_end: b.binderEnd || null,
            lines_of_business: Array.isArray(b.linesOfBusiness) ? b.linesOfBusiness : ['cargo'],
            territories_included: Array.isArray(b.territoriesIncluded) ? b.territoriesIncluded : [],
            territories_excluded: Array.isArray(b.territoriesExcluded) ? b.territoriesExcluded : [],
            commodities_excluded: Array.isArray(b.commoditiesExcluded) ? b.commoditiesExcluded : [],
            premium_handling: b.premiumHandling || 'trust',
            metadata: b.metadata || {},
        });
        // A binder that is live must be remittable from the moment it is recorded.
        if (row.status === 'bound') await ensureLedgerAccount(row, req);
        return sendSuccess(req, res, toApi(row), 201);
    } catch (err) { return next(err); }
};

const update = async (req, res, next) => {
    try {
        const r = await db.InsuranceUnderwriter.findByPk(req.params.id);
        if (!r) return next(new AppError('NOT_FOUND', 'Underwriter not found', 404));
        const b = req.body || {};

        if (b.status === 'bound' && !(b.binderReference || r.binder_reference)) {
            return next(new AppError('BAD_REQUEST', 'a bound underwriter needs a binderReference', 400));
        }
        // Reducing capacity below what is already written would put the binder
        // instantly in breach; the fix is to suspend it, not to shrink it.
        if (b.capacityLimit != null) {
            const used = await placement.capacityUsed(r.id);
            if (Number(b.capacityLimit) < used) {
                return next(new AppError('CAPACITY_BELOW_WRITTEN', `${used} is already written on this binder; suspend it instead of setting a limit below that`, 409));
            }
        }

        const map = {
            name: 'name', legalEntity: 'legal_entity', adapter: 'adapter',
            binderReference: 'binder_reference', status: 'status', currency: 'currency',
            capacityLimit: 'capacity_limit', perRiskLimit: 'per_risk_limit',
            commissionRate: 'commission_rate', ledgerAccountId: 'ledger_account_id',
            binderStart: 'binder_start', binderEnd: 'binder_end', linesOfBusiness: 'lines_of_business',
            territoriesIncluded: 'territories_included', territoriesExcluded: 'territories_excluded',
            commoditiesExcluded: 'commodities_excluded', premiumHandling: 'premium_handling',
        };
        const updates = {};
        for (const [k, col] of Object.entries(map)) if (b[k] !== undefined) updates[col] = b[k];
        await r.update(updates);
        if (r.status === 'bound') await ensureLedgerAccount(r, req);
        return sendSuccess(req, res, toApi(r));
    } catch (err) { return next(err); }
};

/** GET /insurance_underwriters/meta/adapters — which carrier integrations exist. */
const adapters = async (req, res, next) => {
    try {
        return sendSuccess(req, res, {
            registered: supportedAdapters(),
            note: "'manual' means quotes and bindings are exchanged out of band and recorded here — a real working mode for a binder, not a simulation.",
        });
    } catch (err) { return next(err); }
};

/** POST /insurance_underwriters/:id/policies/:policyId/confirm — record the carrier's own policy number. */
const confirmPolicy = async (req, res, next) => {
    try {
        const policy = await db.InsurancePolicy.findByPk(req.params.policyId);
        if (!policy) return next(new AppError('NOT_FOUND', 'Policy not found', 404));
        if (policy.underwriter_id !== req.params.id) {
            return next(new AppError('BAD_REQUEST', 'this policy is not placed with that underwriter', 400));
        }
        const b = req.body || {};
        if (!b.policyRef) return next(new AppError('BAD_REQUEST', 'policyRef (the carrier\'s own policy number) is required', 400));
        await placement.confirmPlacement(policy, { policyRef: b.policyRef, effectiveFrom: b.effectiveFrom, effectiveTo: b.effectiveTo });
        return sendSuccess(req, res, { policyId: policy.id, underwriterPolicyRef: policy.underwriter_policy_ref });
    } catch (err) { return next(err); }
};

// ── the broker's own professional indemnity ──────────────────────────────────
const piId = () => `PI-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

function indemnityToApi(r) {
    const force = r.inForce();
    return {
        id: r.id, coverType: r.cover_type, insurer: r.insurer, policyNumber: r.policy_number,
        currency: r.currency,
        limitOfIndemnity: r.limit_of_indemnity != null ? num(r.limit_of_indemnity) : null,
        retention: num(r.retention), basis: r.basis, retroactiveDate: r.retroactive_date,
        periodStart: r.period_start, periodEnd: r.period_end, status: r.status,
        inForce: force.ok, notInForceReason: force.reason,
        brokerNotes: r.broker_notes,
        createdAt: r.created_at, updatedAt: r.updated_at,
    };
}

const listIndemnity = async (req, res, next) => {
    try {
        const rows = await db.BrokerIndemnity.findAll({ order: [['period_end', 'DESC']], limit: 100 });
        return sendSuccess(req, res, {
            policies: rows.map(indemnityToApi),
            position: await placement.indemnityStatus(req.auth && req.auth.tenantId),
        });
    } catch (err) { return next(err); }
};

/** POST /insurance_underwriters/indemnity — record the broker's E&O / PI cover. */
const createIndemnity = async (req, res, next) => {
    try {
        const b = req.body || {};
        if (!b.insurer || !b.policyNumber) {
            return next(new AppError('BAD_REQUEST', 'insurer and policyNumber are required', 400));
        }
        // Claims-made cover only answers for claims notified in the period, so a
        // missing retroactive date is an unbounded gap, not a cosmetic omission.
        if ((b.basis || 'claims_made') === 'claims_made' && !b.retroactiveDate) {
            return next(new AppError('BAD_REQUEST', 'claims-made cover needs a retroactiveDate — without it the tail is uninsured', 400));
        }
        const row = await db.BrokerIndemnity.create({
            id: b.id || piId(),
            tenant_id: b.tenantId || null,
            cover_type: b.coverType || 'professional_indemnity',
            insurer: b.insurer,
            policy_number: b.policyNumber,
            currency: b.currency || 'USD',
            limit_of_indemnity: b.limitOfIndemnity != null ? Number(b.limitOfIndemnity) : null,
            retention: b.retention != null ? Number(b.retention) : 0,
            basis: b.basis || 'claims_made',
            retroactive_date: b.retroactiveDate || null,
            period_start: b.periodStart || null,
            period_end: b.periodEnd || null,
            status: b.status || 'active',
            broker_notes: b.brokerNotes || null,
        });
        return sendSuccess(req, res, indemnityToApi(row), 201);
    } catch (err) { return next(err); }
};

const updateIndemnity = async (req, res, next) => {
    try {
        const r = await db.BrokerIndemnity.findByPk(req.params.id);
        if (!r) return next(new AppError('NOT_FOUND', 'Indemnity policy not found', 404));
        const b = req.body || {};
        const map = {
            insurer: 'insurer', policyNumber: 'policy_number', currency: 'currency',
            limitOfIndemnity: 'limit_of_indemnity', retention: 'retention', basis: 'basis',
            retroactiveDate: 'retroactive_date', periodStart: 'period_start',
            periodEnd: 'period_end', status: 'status', brokerNotes: 'broker_notes',
        };
        const updates = {};
        for (const [k, col] of Object.entries(map)) if (b[k] !== undefined) updates[col] = b[k];
        await r.update(updates);
        return sendSuccess(req, res, indemnityToApi(r));
    } catch (err) { return next(err); }
};

module.exports = {
    list, get, create, update, adapters, confirmPolicy,
    listIndemnity, createIndemnity, updateIndemnity,
};
