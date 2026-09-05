'use strict';
/**
 * General Average (migration 066) — the voyage-wide loss apportionment that runs
 * alongside the cargo policy. See service/insurance/generalAverage.js for why this
 * exists separately from a claim: after a casualty every cargo interest owes a
 * share of the sacrifice, including owners whose own boxes arrived undamaged, and
 * cargo is not released until security is posted.
 *
 * declared → adjusting → secured → settled → closed.
 */
const crypto = require('crypto');
const db = require('../models');
const config = require('../config/appConfig');
const { apportion } = require('../service/insurance/generalAverage');
const { initiatePayment, refFromInitiate } = require('../lib/financeClient');
const { accountsFor } = require('../lib/insuranceAccounts');
const { isAdmin, callerTenantId, actorOf } = require('./insuranceController');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

const gaId = () => `GA-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
const gacId = () => `GAC-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
const num = (x) => (x == null ? 0 : Number(x) || 0);

const GA_VALID = {
    declared: ['adjusting', 'closed'],
    adjusting: ['secured', 'closed'],
    secured: ['settled', 'closed'],
    settled: ['closed'],
    closed: [],
};

function toApi(r, contributions) {
    return {
        id: r.id, incidentId: r.incident_id, vesselName: r.vessel_name, voyageNo: r.voyage_no,
        declaredBy: r.declared_by, averageAdjuster: r.average_adjuster, declaredAt: r.declared_at,
        status: r.status, currency: r.currency,
        sacrificeValue: num(r.sacrifice_value), salvageExpenses: num(r.salvage_expenses),
        totalContributoryValue: num(r.total_contributory_value),
        contributionRate: r.contribution_rate != null ? Number(r.contribution_rate) : null,
        adjustmentRef: r.adjustment_ref, notes: r.notes,
        createdAt: r.created_at, updatedAt: r.updated_at,
        ...(contributions ? { contributions } : {}),
    };
}

function contributionToApi(r) {
    return {
        id: r.id, gaId: r.ga_id, policyId: r.policy_id, shipmentId: r.shipment_id, containerId: r.container_id,
        cargoOwner: r.cargo_owner, contributoryValue: num(r.contributory_value), contributionAmount: num(r.contribution_amount),
        securityType: r.security_type, securityRef: r.security_ref, status: r.status,
        settledAt: r.settled_at, paymentRef: r.payment_ref,
        createdAt: r.created_at, updatedAt: r.updated_at,
    };
}

async function fetchOwned(id, req, next) {
    const r = await db.GeneralAverageDeclaration.findByPk(id);
    if (!r) { next(new AppError('NOT_FOUND', 'General average declaration not found', 404)); return null; }
    if (!isAdmin(req)) {
        const tenantId = callerTenantId(req);
        if (tenantId && r.tenant_id && r.tenant_id !== tenantId) {
            next(new AppError('NOT_FOUND', 'General average declaration not found', 404)); return null;
        }
    }
    return r;
}

const list = async (req, res, next) => {
    try {
        const where = {};
        if (req.query.status) where.status = req.query.status;
        if (req.query.incidentId) where.incident_id = req.query.incidentId;
        if (!isAdmin(req)) {
            const tenantId = callerTenantId(req);
            if (tenantId) where.tenant_id = tenantId;
        }
        const rows = await db.GeneralAverageDeclaration.findAll({ where, order: [['created_at', 'DESC']], limit: 200 });
        return sendSuccess(req, res, rows.map((r) => toApi(r)));
    } catch (err) { return next(err); }
};

const get = async (req, res, next) => {
    try {
        const r = await fetchOwned(req.params.id, req, next); if (!r) return undefined;
        const rows = await db.GeneralAverageContribution.findAll({ where: { ga_id: r.id }, order: [['created_at', 'ASC']] });
        return sendSuccess(req, res, toApi(r, rows.map(contributionToApi)));
    } catch (err) { return next(err); }
};

/** POST /general_average — the shipowner declares GA for a voyage after a casualty. */
const declare = async (req, res, next) => {
    try {
        const b = req.body || {};
        const tenantId = callerTenantId(req);

        if (b.incidentId || b.incident_id) {
            const incident = await db.Incident.findByPk(b.incidentId || b.incident_id);
            if (!incident) return next(new AppError('NOT_FOUND', 'Incident not found', 404));
        }

        const row = await db.GeneralAverageDeclaration.create({
            id: b.id || gaId(),
            incident_id: b.incidentId ?? b.incident_id ?? null,
            vessel_name: b.vesselName ?? b.vessel_name,
            voyage_no: b.voyageNo ?? b.voyage_no,
            declared_by: b.declaredBy ?? b.declared_by ?? actorOf(req),
            average_adjuster: b.averageAdjuster ?? b.average_adjuster,
            declared_at: b.declaredAt ?? b.declared_at ?? new Date(),
            currency: b.currency || 'USD',
            sacrifice_value: num(b.sacrificeValue ?? b.sacrifice_value),
            salvage_expenses: num(b.salvageExpenses ?? b.salvage_expenses),
            notes: b.notes,
            status: 'declared',
            ...(tenantId ? { tenant_id: tenantId } : {}),
        });
        return sendSuccess(req, res, toApi(row), 201);
    } catch (err) { return next(err); }
};

const update = async (req, res, next) => {
    try {
        const r = await fetchOwned(req.params.id, req, next); if (!r) return undefined;
        if (['settled', 'closed'].includes(r.status)) {
            return next(new AppError('INVALID_TRANSITION', `cannot amend a '${r.status}' adjustment`, 409));
        }
        const b = req.body || {};
        const updates = {};
        if (b.sacrificeValue != null || b.sacrifice_value != null) updates.sacrifice_value = num(b.sacrificeValue ?? b.sacrifice_value);
        if (b.salvageExpenses != null || b.salvage_expenses != null) updates.salvage_expenses = num(b.salvageExpenses ?? b.salvage_expenses);
        if (b.averageAdjuster || b.average_adjuster) updates.average_adjuster = b.averageAdjuster ?? b.average_adjuster;
        if (b.adjustmentRef || b.adjustment_ref) updates.adjustment_ref = b.adjustmentRef ?? b.adjustment_ref;
        if (b.notes !== undefined) updates.notes = b.notes;
        await r.update(updates);
        const result = await apportion(r);
        return sendSuccess(req, res, { ...toApi(r), apportionment: result });
    } catch (err) { return next(err); }
};

const transition = (to) => async (req, res, next) => {
    try {
        const r = await fetchOwned(req.params.id, req, next); if (!r) return undefined;
        if (!(GA_VALID[r.status] || []).includes(to)) {
            return next(new AppError('INVALID_TRANSITION', `cannot move a general average from '${r.status}' to '${to}'`, 409));
        }
        if (to === 'secured') {
            const outstanding = await db.GeneralAverageContribution.count({ where: { ga_id: r.id, status: 'pending' } });
            if (outstanding > 0) {
                return next(new AppError('SECURITY_OUTSTANDING', `${outstanding} cargo interest(s) have not posted security yet`, 409));
            }
        }
        await r.update({ status: to });
        return sendSuccess(req, res, toApi(r));
    } catch (err) { return next(err); }
};

/** POST /general_average/:id/contributions — enrol one cargo interest in the adjustment. */
const addContribution = async (req, res, next) => {
    try {
        const r = await fetchOwned(req.params.id, req, next); if (!r) return undefined;
        if (['settled', 'closed'].includes(r.status)) {
            return next(new AppError('INVALID_TRANSITION', `cannot add interests to a '${r.status}' adjustment`, 409));
        }
        const b = req.body || {};
        const policyId = b.policyId ?? b.policy_id ?? null;
        if (policyId) {
            const policy = await db.InsurancePolicy.findByPk(policyId);
            if (!policy) return next(new AppError('NOT_FOUND', 'Policy not found', 404));
        }

        const row = await db.GeneralAverageContribution.create({
            id: b.id || gacId(),
            ga_id: r.id,
            policy_id: policyId,
            shipment_id: b.shipmentId ?? b.shipment_id,
            container_id: b.containerId ?? b.container_id ?? null,
            cargo_owner: b.cargoOwner ?? b.cargo_owner,
            // Contributory value is what the interest was worth at the end of the
            // adventure — not the invoice value — so it is supplied by the adjuster.
            contributory_value: num(b.contributoryValue ?? b.contributory_value),
            security_type: b.securityType ?? b.security_type ?? 'none',
            security_ref: b.securityRef ?? b.security_ref,
            status: 'pending',
            tenant_id: r.tenant_id,
        });

        // apportion() rewrites every share including this one — re-read so the
        // response carries the amount actually owed, not the pre-apportionment zero.
        const result = await apportion(r);
        await row.reload();
        // Enrolling the first interest IS the adjustment starting; leaving the
        // declaration in 'declared' would block the later move to 'secured'.
        if (r.status === 'declared') await r.update({ status: 'adjusting' });
        return sendSuccess(req, res, { contribution: contributionToApi(row), apportionment: result }, 201);
    } catch (err) { return next(err); }
};

/** POST /general_average/:id/contributions/:contributionId/secure — record the bond/guarantee/deposit. */
const secureContribution = async (req, res, next) => {
    try {
        const r = await fetchOwned(req.params.id, req, next); if (!r) return undefined;
        const row = await db.GeneralAverageContribution.findOne({ where: { id: req.params.contributionId, ga_id: r.id } });
        if (!row) return next(new AppError('NOT_FOUND', 'Contribution not found', 404));

        const b = req.body || {};
        const securityType = b.securityType ?? b.security_type ?? 'average_bond';
        if (!db.GeneralAverageContribution.SECURITY_TYPES.includes(securityType) || securityType === 'none') {
            return next(new AppError('BAD_REQUEST', `unknown security type '${securityType}'`, 400));
        }
        await row.update({ security_type: securityType, security_ref: b.securityRef ?? b.security_ref ?? row.security_ref, status: 'secured' });
        return sendSuccess(req, res, contributionToApi(row));
    } catch (err) { return next(err); }
};

/** POST /general_average/:id/contributions/:contributionId/settle — pay the apportioned share. */
const settleContribution = async (req, res, next) => {
    try {
        const r = await fetchOwned(req.params.id, req, next); if (!r) return undefined;
        const row = await db.GeneralAverageContribution.findOne({ where: { id: req.params.contributionId, ga_id: r.id } });
        if (!row) return next(new AppError('NOT_FOUND', 'Contribution not found', 404));
        if (row.status === 'settled') return sendSuccess(req, res, contributionToApi(row));
        if (row.status === 'waived') return next(new AppError('INVALID_TRANSITION', 'this contribution was waived', 409));
        if (num(row.contribution_amount) <= 0) {
            return next(new AppError('NOT_APPORTIONED', 'the adjustment has not been apportioned yet — set the sacrifice and contributory values first', 409));
        }

        let paymentRef = `GA-${crypto.randomInt(100000, 999999)}`;
        if (config.finance.enabled) {
            try {
                // A GA contribution is owed BY the cargo interest, so it moves the same
                // way a premium does: assured → the book holding the adjustment.
                const policy = row.policy_id ? await db.InsurancePolicy.findByPk(row.policy_id) : null;
                const accounts = await accountsFor('premium', req, policy || { tenant_id: r.tenant_id });
                const result = await initiatePayment({ ...accounts, amount: num(row.contribution_amount), currency: r.currency, scheme: 'INTERNAL', metadata: { kind: 'general_average_contribution', gaId: r.id, contributionId: row.id } },
                    { tenantId: req.tenantId, idempotencyKey: `ga-${row.id}` });
                paymentRef = refFromInitiate(result) || paymentRef;
            } catch (e) {
                return next(new AppError('FINANCE_UNAVAILABLE', `contribution payment failed: ${e.message}`, e.status && e.status < 500 ? 400 : 502));
            }
        }
        await row.update({ status: 'settled', settled_at: new Date(), payment_ref: paymentRef });

        const all = await db.GeneralAverageContribution.findAll({ where: { ga_id: r.id } });
        if (all.every((x) => ['settled', 'waived'].includes(x.status)) && r.status !== 'closed') {
            await r.update({ status: 'settled' });
        }
        return sendSuccess(req, res, contributionToApi(row));
    } catch (err) { return next(err); }
};

/** POST /general_average/:id/apportion — recompute the rate and every share. */
const runApportionment = async (req, res, next) => {
    try {
        const r = await fetchOwned(req.params.id, req, next); if (!r) return undefined;
        const result = await apportion(r);
        if (r.status === 'declared') await r.update({ status: 'adjusting' });
        return sendSuccess(req, res, { ...toApi(r), apportionment: result });
    } catch (err) { return next(err); }
};

module.exports = {
    list, get, declare, update, addContribution, secureContribution, settleContribution, runApportionment,
    markSecured: transition('secured'), markSettled: transition('settled'), close: transition('closed'),
};
