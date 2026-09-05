'use strict';
/**
 * Trade Insurance (Logistics #7).
 *
 * Policies: quote → bind (premium charged) → active → claimed/expired/cancelled.
 * Claims:   filed → evidence_required → under_review → approved → paid (or rejected).
 *
 * Premium pricing composes providers/insurance.js (class rate) with
 * service/insurance/laneRisk.js (a multiplier measured from this platform's own
 * loss history on the lane, with its provenance attached — never an invented
 * score). Premium charge and claim payout compose the finance facade (Java
 * payment-service) when finance is enabled, else simulated refs.
 *
 * Migration 066 closed four holes that made the money path wrong rather than
 * merely incomplete: the deductible was never applied, a policy could pay out
 * past its own coverage across several claims, cover never expired, and a claim
 * could be approved with no evidence at all. See service/insurance/settlement.js
 * and service/insurance/evidence.js.
 */
const crypto = require('crypto');
const { Op } = require('sequelize');
const db = require('../models');
const config = require('../config/appConfig');
const ins = require('../providers/insurance');
const { computeLaneRisk } = require('../service/insurance/laneRisk');
const { coverPeriodFor, coversDate, expireDuePolicies } = require('../service/insurance/coverPeriod');
const evidence = require('../service/insurance/evidence');
const { computeSettlement, remainingCoverage } = require('../service/insurance/settlement');
const notify = require('../service/insurance/notify');
const { initiatePayment, refFromInitiate } = require('../lib/financeClient');
const { accountsFor, trustFlow } = require('../lib/insuranceAccounts');
const placement = require('../service/insurance/placement');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

const pid = () => `INS-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
const cid = () => `CLM-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
const did = () => `CLD-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
const num = (x) => (x == null ? 0 : Number(x) || 0);

// ── Tenant helpers ────────────────────────────────────────────────────────────
function isAdmin(req) {
    const roles = (req.auth && req.auth.roles) || [];
    return roles.some((r) => r === 'admin' || r === 'super_admin' || r === 'owner');
}

function callerTenantId(req) {
    return (req.auth && (req.auth.tenantId || req.auth.orgId)) || null;
}

function actorOf(req) {
    return (req.auth && (req.auth.email || req.auth.userId || req.auth.sub)) || 'system';
}

async function fetchPolicyOwned(id, req, next) {
    const r = await db.InsurancePolicy.findByPk(id);
    if (!r) { next(new AppError('NOT_FOUND', 'Policy not found', 404)); return null; }
    if (!isAdmin(req)) {
        const tenantId = callerTenantId(req);
        if (tenantId && r.tenant_id && r.tenant_id !== tenantId) {
            next(new AppError('NOT_FOUND', 'Policy not found', 404)); return null;
        }
    }
    // Lazy expiry: between scheduler sweeps an out-of-date policy must not read
    // back as active, or a claim could be filed against cover that has run out.
    if (r.status === 'active' && r.end_date && new Date(r.end_date) < new Date()) {
        await r.update({ status: 'expired', expired_at: new Date() });
    }
    return r;
}

async function fetchClaimOwned(id, req, next) {
    const c = await db.InsuranceClaim.findByPk(id);
    if (!c) { next(new AppError('NOT_FOUND', 'Claim not found', 404)); return null; }
    if (isAdmin(req)) return c;
    const tenantId = callerTenantId(req);
    if (tenantId && c.tenant_id && c.tenant_id !== tenantId) {
        next(new AppError('NOT_FOUND', 'Claim not found', 404)); return null;
    }
    return c;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The tradeops shipment a policy/claim points at. Null when none is named. */
async function resolveShipment(shipmentId) {
    if (!shipmentId || !UUID_RE.test(String(shipmentId))) return null;
    try {
        return await db.TradeShipment.findByPk(String(shipmentId));
    } catch {
        return null;
    }
}

/**
 * Since migration 068 the column is a real FK, so a bad reference is a constraint
 * violation rather than a silently useless string. Turn it into a 400 the caller
 * can act on, and reject the legacy free-text ids outright.
 */
async function assertShipmentRef(shipmentId) {
    if (shipmentId == null || shipmentId === '') return null;
    if (!UUID_RE.test(String(shipmentId))) {
        throw new AppError('BAD_SHIPMENT_REF', `'${shipmentId}' is not a shipment id — insurance references tradeops shipments by UUID`, 400);
    }
    const shipment = await resolveShipment(shipmentId);
    if (!shipment) throw new AppError('NOT_FOUND', 'Shipment not found', 404);
    return shipment;
}

// ── policy mapping ───────────────────────────────────────────────────────────
function policyToApi(r) {
    return {
        id: r.id, shipmentId: r.shipment_id, orderId: r.order_id, policyNumber: r.policy_number,
        type: r.insurance_type, status: r.status, provider: r.provider,
        coverageAmount: num(r.coverage_amount), currency: r.currency, premium: num(r.premium),
        premiumRate: r.premium_rate != null ? Number(r.premium_rate) : undefined, deductible: num(r.deductible),
        insured: r.insured, beneficiary: r.beneficiary, coverageTerms: r.coverage_terms,
        coverageBasis: r.coverage_basis, riskAssessment: r.risk_assessment,
        // Who actually carries this risk, and how the gross premium was split.
        underwriterId: r.underwriter_id, underwriterPolicyRef: r.underwriter_policy_ref,
        placementStatus: r.placement_status,
        commissionRate: r.commission_rate != null ? Number(r.commission_rate) : undefined,
        commissionAmount: r.commission_amount != null ? num(r.commission_amount) : undefined,
        netPremium: r.net_premium != null ? num(r.net_premium) : undefined,
        remittanceRef: r.remittance_ref,
        premiumHeldInTrust: r.premium_held_in_trust,
        commissionDrawnAt: r.commission_drawn_at,
        // Why every binder refused. "Platform retained" without this is an outcome
        // nobody can act on — the operator needs to know whether to widen a binder's
        // territory, raise a limit, or decline the business.
        placementDeclines: (r.metadata && r.metadata.placementDeclines) || undefined,
        adviceBasis: r.advice_basis,
        disclosureAcceptedAt: r.disclosure_accepted_at,
        parametricTrigger: r.parametric_trigger, premiumPaymentRef: r.premium_payment_ref,
        startDate: r.start_date, endDate: r.end_date, boundAt: r.bound_at, expiredAt: r.expired_at,
        createdAt: r.created_at, updatedAt: r.updated_at,
    };
}

function policyFromApi(b = {}) {
    const v = {
        shipment_id: b.shipmentId ?? b.shipment_id,
        order_id: b.orderId ?? b.order_id,
        insurance_type: b.type ?? b.insuranceType ?? b.insurance_type,
        provider: b.provider,
        coverage_amount: b.coverageAmount ?? b.coverage_amount,
        currency: b.currency,
        insured: b.insured,
        beneficiary: b.beneficiary,
        coverage_terms: b.coverageTerms ?? b.coverage_terms,
        parametric_trigger: b.parametricTrigger ?? b.parametric_trigger,
        metadata: b.metadata,
    };
    Object.keys(v).forEach((k) => v[k] === undefined && delete v[k]);
    return v;
}

/**
 * Price a cover. Where a shipment is named, the lane risk is measured from that
 * shipment's actual route and container; the response always carries the basis so
 * a caller can tell a measured multiplier from a base-rate fallback.
 */
async function priceCover(body = {}) {
    const shipment = await resolveShipment(body.shipmentId ?? body.shipment_id);

    const transitDays = shipment && shipment.estimated_departure && shipment.estimated_arrival
        ? Math.max(0, Math.round((new Date(shipment.estimated_arrival) - new Date(shipment.estimated_departure)) / 86400000))
        : Number(body.transitDays) || 0;

    const risk = await computeLaneRisk({
        originPort: body.originPort ?? (shipment && shipment.origin_port),
        destinationPort: body.destinationPort ?? (shipment && shipment.destination_port),
        originCountry: body.originCountry ?? (shipment && shipment.origin_country),
        destinationCountry: body.destinationCountry ?? (shipment && shipment.destination_country),
        containerType: body.containerType,
        transitDays,
    });

    // Coverage defaults to the shipment's declared value — the sum actually at
    // risk — rather than a figure typed into the insurance form in isolation.
    const coverageAmount = body.coverageAmount ?? body.coverage_amount
        ?? (shipment ? num(shipment.declared_value) : 0);

    const quoted = ins.computePremium({
        insuranceType: body.type ?? body.insuranceType,
        coverageAmount,
        riskMultiplier: body.riskMultiplier != null ? Number(body.riskMultiplier) : risk.multiplier,
        deductibleRate: body.deductibleRate,
    });

    return {
        ...quoted,
        currency: body.currency || (shipment && shipment.currency) || 'USD',
        risk,
        shipment: shipment ? {
            id: shipment.id, shipmentNo: shipment.shipment_no, mode: shipment.mode,
            originPort: shipment.origin_port, destinationPort: shipment.destination_port,
            originCountry: shipment.origin_country, destinationCountry: shipment.destination_country,
            estimatedDeparture: shipment.estimated_departure, estimatedArrival: shipment.estimated_arrival,
            declaredValue: num(shipment.declared_value), currency: shipment.currency, transitDays,
        } : null,
    };
}

// ── policies ─────────────────────────────────────────────────────────────────
const quote = async (req, res, next) => {
    try {
        return sendSuccess(req, res, await priceCover(req.body || {}));
    } catch (err) { return next(err); }
};

const listPolicies = async (req, res, next) => {
    try {
        const where = {};
        const sid = req.query.shipmentId || req.query.shipment_id;
        if (sid) where.shipment_id = sid;
        if (req.query.status) where.status = req.query.status;
        if (req.query.type) where.insurance_type = req.query.type;
        if (!isAdmin(req)) {
            const tenantId = callerTenantId(req);
            if (tenantId) where.tenant_id = tenantId;
        }
        const rows = await db.InsurancePolicy.findAll({ where, order: [['created_at', 'DESC']], limit: 500 });
        // Sweep the page being read, so a list never shows cover that has lapsed.
        await expireDuePolicies({ policyIds: rows.filter((r) => r.status === 'active').map((r) => r.id) });
        const fresh = await db.InsurancePolicy.findAll({ where, order: [['created_at', 'DESC']], limit: 500 });
        return sendSuccess(req, res, fresh.map(policyToApi));
    } catch (err) { return next(err); }
};

const getPolicy = async (req, res, next) => {
    try {
        const r = await fetchPolicyOwned(req.params.id, req, next);
        if (!r) return undefined;
        const claims = await db.InsuranceClaim.findAll({ where: { policy_id: r.id }, order: [['created_at', 'DESC']] });
        return sendSuccess(req, res, {
            ...policyToApi(r),
            remainingCoverage: await remainingCoverage(r),
            claims: claims.map(claimToApi),
        });
    } catch (err) { return next(err); }
};

const createPolicy = async (req, res, next) => {
    try {
        const b = req.body || {};
        const v = policyFromApi(b);
        await assertShipmentRef(v.shipment_id);
        const priced = await priceCover(b);
        v.id = b.id || pid();
        v.policy_number = b.policyNumber || `POL-${crypto.randomInt(10000000, 99999999)}`;
        v.coverage_amount = v.coverage_amount != null ? v.coverage_amount : priced.coverageAmount;
        v.currency = v.currency || priced.currency;
        v.premium = b.premium != null ? b.premium : priced.premium;
        v.premium_rate = priced.premiumRate;
        v.deductible = b.deductible != null ? b.deductible : priced.deductible;
        v.risk_assessment = priced.risk;
        v.status = 'pending'; // quoted, awaiting bind
        // The basis on which cover was sold is the broker's defence in an E&O claim,
        // so it is recorded when the policy is created rather than reconstructed later.
        v.advice_basis = b.adviceBasis || 'non_advised';
        if (b.disclosureVersion) {
            v.disclosure_version = String(b.disclosureVersion);
            v.disclosure_accepted_at = new Date();
        }
        // Stamp tenant_id from server context; never accept from client.
        const tenantId = callerTenantId(req);
        if (tenantId) v.tenant_id = tenantId;
        const row = await db.InsurancePolicy.create(v);
        return sendSuccess(req, res, policyToApi(row), 201);
    } catch (err) { return next(err); }
};

// POST /:id/bind — pay the premium and attach the cover for the voyage.
const bindPolicy = async (req, res, next) => {
    try {
        const r = await fetchPolicyOwned(req.params.id, req, next);
        if (!r) return undefined;
        if (r.status === 'active') return sendSuccess(req, res, policyToApi(r));
        if (!['pending', 'quoted'].includes(r.status)) {
            return next(new AppError('INVALID_TRANSITION', `cannot bind a policy in '${r.status}' state`, 409));
        }
        if (num(r.coverage_amount) <= 0) {
            return next(new AppError('NO_COVERAGE', 'cannot bind a policy with no coverage amount', 400));
        }

        // Decide whose paper this sits on BEFORE any money moves — placement can
        // change the premium (a carrier's own rate governs) and determines which
        // account the premium is remitted to.
        const placed = await placement.placePolicy(r, { line: r.insurance_type || 'cargo' });
        if (placed.placement_declined) {
            return next(new AppError('RISK_DECLINED', placed.reason, 409));
        }
        if (r.placement_status === 'declined') {
            return next(new AppError('RISK_DECLINED', placed.reason || 'the underwriter declined this risk', 409));
        }

        let premiumRef = `PREM-${crypto.randomInt(100000, 999999)}`;
        if (config.finance.enabled) {
            try {
                if (r.premium_held_in_trust) {
                    // Client money. The assured's GROSS premium is collected into the
                    // segregated trust account first, then remitted, then commission is
                    // drawn. Netting commission at collection would mean never holding
                    // the carrier's full premium — the thing client-money rules forbid.
                    const flow = await trustFlow(req, r);
                    const collected = await initiatePayment({ ...flow.collect, amount: num(r.premium), currency: r.currency, scheme: 'INTERNAL', metadata: { kind: 'insurance_premium_collected', policyId: r.id, underwriterId: r.underwriter_id, segregated: flow.segregated } },
                        { tenantId: req.tenantId, idempotencyKey: `prem-collect-${r.id}` });
                    premiumRef = refFromInitiate(collected) || premiumRef;

                    await initiatePayment({ ...flow.remit, amount: num(r.net_premium), currency: r.currency, scheme: 'INTERNAL', metadata: { kind: 'insurance_premium_remitted', policyId: r.id, underwriterId: r.underwriter_id } },
                        { tenantId: req.tenantId, idempotencyKey: `prem-remit-${r.id}` });

                    if (num(r.commission_amount) > 0) {
                        const drawn = await initiatePayment({ ...flow.drawCommission, amount: num(r.commission_amount), currency: r.currency, scheme: 'INTERNAL', metadata: { kind: 'broker_commission_drawn', policyId: r.id, underwriterId: r.underwriter_id } },
                            { tenantId: req.tenantId, idempotencyKey: `comm-${r.id}` });
                        await r.update({ commission_drawn_at: new Date(), commission_draw_ref: refFromInitiate(drawn) || null });
                    }
                    await r.update({ trust_account_id: flow.trustAccountId });
                } else {
                    const accounts = await accountsFor('premium', req, r);
                    // 'direct' binder (or an unplaced policy): the money moves once.
                    const payable = r.underwriter_id && r.net_premium != null ? num(r.net_premium) : num(r.premium);
                    const result = await initiatePayment({ ...accounts, amount: payable, currency: r.currency, scheme: 'INTERNAL', metadata: { kind: 'insurance_premium', policyId: r.id, underwriterId: r.underwriter_id || null, grossPremium: num(r.premium), commission: num(r.commission_amount) } },
                        { tenantId: req.tenantId, idempotencyKey: `prem-${r.id}` });
                    premiumRef = refFromInitiate(result) || premiumRef;
                }
            } catch (e) {
                return next(new AppError('FINANCE_UNAVAILABLE', `premium charge failed: ${e.message}`, e.status && e.status < 500 ? 400 : 502));
            }
        }

        const shipment = await resolveShipment(r.shipment_id);
        const period = coverPeriodFor({ shipment, termMonths: req.body && req.body.termMonths });
        await r.update({
            status: 'active',
            bound_at: new Date(),
            premium_payment_ref: premiumRef,
            start_date: period.startDate,
            end_date: period.endDate,
            coverage_basis: period.basis,
            metadata: { ...(r.metadata || {}), coverPeriod: period.detail },
            ...(r.underwriter_id ? { remittance_ref: premiumRef } : {}),
        });
        notify.notify('policy_bound', {
            tenantId: r.tenant_id, entityType: 'insurance_policy', entityId: r.id,
            ref: r.policy_number, money: notify.money(r.coverage_amount, r.currency), until: notify.day(r.end_date),
        }).catch(() => {});
        return sendSuccess(req, res, policyToApi(r));
    } catch (err) { return next(err); }
};

const cancelPolicy = async (req, res, next) => {
    try {
        const r = await fetchPolicyOwned(req.params.id, req, next);
        if (!r) return undefined;
        await r.update({ status: 'cancelled', metadata: { ...(r.metadata || {}), cancelReason: (req.body && req.body.reason) || null } });
        return sendSuccess(req, res, policyToApi(r));
    } catch (err) { return next(err); }
};

// POST /insurance_policies/expire_due — scheduler entry point for the expiry sweep.
const expirePolicies = async (req, res, next) => {
    try {
        return sendSuccess(req, res, await expireDuePolicies({}));
    } catch (err) { return next(err); }
};

/**
 * GET /insurance_policies/summary — the portfolio figures the dashboard shows.
 * Every number here is counted from this tenant's own rows; there is no seeded
 * baseline, so an empty book reports zeroes rather than a plausible-looking total.
 */
const summary = async (req, res, next) => {
    try {
        const where = {};
        if (!isAdmin(req)) {
            const tenantId = callerTenantId(req);
            if (tenantId) where.tenant_id = tenantId;
        }
        const policies = await db.InsurancePolicy.findAll({ where, limit: 5000 });
        const claims = await db.InsuranceClaim.findAll({ where, limit: 5000 });

        const active = policies.filter((p) => p.status === 'active');
        const paid = claims.filter((c) => c.status === 'paid');
        const settled = claims.filter((c) => ['paid', 'rejected'].includes(c.status) && c.filed_at && c.resolved_at);
        const openClaims = claims.filter((c) => !['paid', 'rejected', 'withdrawn'].includes(c.status));

        const premiumEarned = policies.filter((p) => p.bound_at).reduce((s, p) => s + num(p.premium), 0);
        const paidOut = paid.reduce((s, c) => s + num(c.payout_amount), 0);
        const recovered = claims.reduce((s, c) => s + num(c.subrogation_recovered), 0);

        const avgSettlementDays = settled.length
            ? settled.reduce((s, c) => s + (new Date(c.resolved_at) - new Date(c.filed_at)), 0) / settled.length / 86400000
            : null;

        // ── Broker economics ─────────────────────────────────────────────────
        // The distinction that matters: commission is REVENUE (earned on placed
        // business, no risk attached), whereas a platform-retained policy is
        // EXPOSURE — Baalvion's own balance sheet answers for the whole sum insured.
        // Reporting them as one number would hide exactly the thing worth watching.
        const placedPolicies = policies.filter((p) => p.placement_status === 'placed');
        const retained = policies.filter((p) => p.placement_status === 'platform_retained' && ['active', 'claimed'].includes(p.status));
        const commissionEarned = placedPolicies.filter((p) => p.bound_at).reduce((s2, p) => s2 + num(p.commission_amount), 0);
        const remitted = placedPolicies.filter((p) => p.bound_at).reduce((s2, p) => s2 + num(p.net_premium), 0);
        const retainedExposure = retained.reduce((s2, p) => s2 + num(p.coverage_amount), 0);
        const carrierSettled = claims.reduce((s2, c) => s2 + num(c.underwriter_settled_amount), 0);

        const binders = await db.InsuranceUnderwriter.findAll({ where: { status: 'bound' }, limit: 100 });
        const capacity = [];
        for (const uw of binders) {
            const used = await placement.capacityUsed(uw.id);
            const limit = uw.capacity_limit != null ? num(uw.capacity_limit) : null;
            capacity.push({
                id: uw.id, name: uw.name, used, limit,
                remaining: limit == null ? null : Math.max(0, Math.round((limit - used) * 100) / 100),
                utilisation: limit ? Math.round((used / limit) * 10000) / 10000 : null,
            });
        }

        return sendSuccess(req, res, {
            broker: {
                // The broker's own professional indemnity. Unfunded E&O is what
                // actually ends broking businesses, so it leads the block.
                indemnity: await placement.indemnityStatus(callerTenantId(req)),
                boundBinders: binders.length,
                placedPolicies: placedPolicies.length,
                retainedPolicies: retained.length,
                commissionEarned: Math.round(commissionEarned * 100) / 100,
                premiumRemitted: Math.round(remitted * 100) / 100,
                // The number to watch: cover written on Baalvion's own book because no
                // binder could take it.
                platformRetainedExposure: Math.round(retainedExposure * 100) / 100,
                carrierSettledOnClaims: Math.round(carrierSettled * 100) / 100,
                capacity,
            },
            activePolicies: active.length,
            totalPolicies: policies.length,
            insuredValueActive: Math.round(active.reduce((s, p) => s + num(p.coverage_amount), 0) * 100) / 100,
            premiumEarned: Math.round(premiumEarned * 100) / 100,
            openClaims: openClaims.length,
            totalClaims: claims.length,
            claimsPaidOut: Math.round(paidOut * 100) / 100,
            subrogationRecovered: Math.round(recovered * 100) / 100,
            // Net loss ratio — payouts less recoveries over premium earned. Null (not
            // zero, and not a placeholder) until there is premium to divide by.
            lossRatio: premiumEarned > 0 ? Math.round(((paidOut - recovered) / premiumEarned) * 10000) / 10000 : null,
            avgSettlementDays: avgSettlementDays != null ? Math.round(avgSettlementDays * 10) / 10 : null,
            settledClaimCount: settled.length,
        });
    } catch (err) { return next(err); }
};

// ── claims ───────────────────────────────────────────────────────────────────
const CLAIM_VALID = {
    filed: ['evidence_required', 'under_review', 'rejected', 'withdrawn'],
    evidence_required: ['under_review', 'rejected', 'withdrawn'],
    under_review: ['approved', 'rejected', 'evidence_required'],
    approved: ['paid'],
    paid: [], rejected: [], withdrawn: [],
};

function claimToApi(r) {
    return {
        id: r.id, policyId: r.policy_id, shipmentId: r.shipment_id, incidentId: r.incident_id,
        containerId: r.container_id, generalAverageId: r.general_average_id,
        claimNumber: r.claim_number, amount: num(r.amount),
        grossLoss: r.gross_loss != null ? num(r.gross_loss) : undefined,
        status: r.status, lossType: r.loss_type, lossDate: r.loss_date, reason: r.reason, assessor: r.assessor,
        requiredDocuments: r.required_documents || [], evidenceComplete: r.evidence_complete,
        payoutAmount: r.payout_amount != null ? num(r.payout_amount) : undefined,
        deductibleApplied: r.deductible_applied != null ? num(r.deductible_applied) : undefined,
        payoutRef: r.payout_ref,
        subrogationStatus: r.subrogation_status, subrogationRecovered: num(r.subrogation_recovered), subrogationRef: r.subrogation_ref,
        // What the CARRIER settled on their paper — distinct from the payout to the
        // assured, and from subrogation (recovery from whoever caused the loss).
        underwriterClaimRef: r.underwriter_claim_ref,
        underwriterSettledAmount: r.underwriter_settled_amount != null ? num(r.underwriter_settled_amount) : undefined,
        underwriterSettledAt: r.underwriter_settled_at,
        filedAt: r.filed_at, resolvedAt: r.resolved_at, paidAt: r.paid_at,
        createdAt: r.created_at, updatedAt: r.updated_at,
        metadata: r.metadata,
    };
}

function assertClaim(c, to) {
    if (!(CLAIM_VALID[c.status] || []).includes(to)) {
        throw new AppError('INVALID_TRANSITION', `cannot move claim from '${c.status}' to '${to}'`, 409);
    }
}

const listClaims = async (req, res, next) => {
    try {
        const where = {};
        const pidq = req.query.policyId || req.query.policy_id;
        if (pidq) where.policy_id = pidq;
        if (req.query.status) where.status = req.query.status;
        if (req.query.incidentId) where.incident_id = req.query.incidentId;
        if (!isAdmin(req)) {
            const tenantId = callerTenantId(req);
            if (tenantId) where.tenant_id = tenantId;
        }
        const rows = await db.InsuranceClaim.findAll({ where, order: [['created_at', 'DESC']], limit: 500 });
        return sendSuccess(req, res, rows.map(claimToApi));
    } catch (err) { return next(err); }
};

const getClaim = async (req, res, next) => {
    try {
        const c = await fetchClaimOwned(req.params.id, req, next);
        if (!c) return undefined;
        const policy = await db.InsurancePolicy.findByPk(c.policy_id);
        const state = await evidence.evaluate(c);
        return sendSuccess(req, res, {
            ...claimToApi(c),
            evidence: state,
            policy: policy ? policyToApi(policy) : null,
            settlementPreview: policy && !['paid', 'rejected', 'withdrawn'].includes(c.status)
                ? await computeSettlement(c, policy)
                : null,
        });
    } catch (err) { return next(err); }
};

/**
 * Shared filing path. `incident` is optional — when present the claim inherits
 * what physically happened from the operational record instead of asking the
 * claimant to retype it, which is the whole point of the incident → claim link.
 */
async function createClaim({ body, req, incident }) {
    const b = body || {};
    const policyId = b.policyId || b.policy_id;
    if (!policyId) throw new AppError('BAD_REQUEST', 'policyId is required', 400);

    const policy = await db.InsurancePolicy.findByPk(policyId);
    if (!policy) throw new AppError('NOT_FOUND', 'Policy not found', 404);

    const tenantId = callerTenantId(req);
    if (!isAdmin(req) && tenantId && policy.tenant_id && policy.tenant_id !== tenantId) {
        throw new AppError('NOT_FOUND', 'Policy not found', 404);
    }

    // Expire before testing status, so cover that ran out cannot be claimed against.
    if (policy.status === 'active' && policy.end_date && new Date(policy.end_date) < new Date()) {
        await policy.update({ status: 'expired', expired_at: new Date() });
    }
    if (policy.status !== 'active') {
        throw new AppError('POLICY_NOT_ACTIVE', `policy is '${policy.status}', not active`, 409);
    }

    const lossType = b.lossType || b.loss_type || (incident ? incidentToLossType(incident) : null);
    const lossDate = b.lossDate || b.loss_date || (incident ? incident.reported_at : null) || new Date();

    const cover = coversDate(policy, lossDate);
    if (!cover.covered) {
        throw new AppError('OUTSIDE_COVER_PERIOD', `claim rejected: ${cover.reason}`, 409);
    }

    const amount = num(b.amount);
    if (amount <= 0) throw new AppError('BAD_REQUEST', 'claim amount must be greater than zero', 400);
    if (amount > num(policy.coverage_amount)) {
        throw new AppError('OVER_COVERAGE', 'claim amount exceeds policy coverage', 400);
    }
    // A single claim under the limit can still break the policy once earlier
    // settlements are counted — that gap is what let a policy overpay itself.
    const available = await remainingCoverage(policy);
    if (amount > available) {
        throw new AppError('OVER_REMAINING_COVERAGE', `only ${available} of cover remains on this policy after earlier claims`, 400);
    }

    const required = evidence.requiredDocumentsFor(lossType);
    const claimShipment = b.shipmentId ?? b.shipment_id ?? (incident && incident.shipment_id) ?? policy.shipment_id ?? null;
    if (claimShipment && !(incident && claimShipment === incident.shipment_id)) await assertShipmentRef(claimShipment);

    return db.InsuranceClaim.create({
        id: b.id || cid(),
        policy_id: policyId,
        shipment_id: claimShipment,
        incident_id: incident ? incident.id : (b.incidentId ?? b.incident_id ?? null),
        container_id: (incident && incident.container_id) || b.containerId || b.container_id || null,
        claim_number: b.claimNumber || `CLM-${crypto.randomInt(10000000, 99999999)}`,
        amount,
        gross_loss: b.grossLoss != null ? num(b.grossLoss) : amount,
        loss_type: lossType,
        loss_date: lossDate,
        reason: b.reason || (incident ? incident.description : null),
        required_documents: required,
        evidence_complete: false,
        status: 'evidence_required',
        filed_at: new Date(),
        ...(tenantId ? { tenant_id: tenantId } : {}),
        metadata: {
            ...(b.metadata || {}),
            ...(incident ? { filedFromIncident: { id: incident.id, type: incident.incident_type, severity: incident.severity, reportedAt: incident.reported_at } } : {}),
        },
    });
}

/**
 * A claim on a placed policy is the CARRIER's loss. Telling them late is how a binder
 * gets pulled, so first advice goes out when the claim is filed, not when it settles.
 */
async function adviseUnderwriter(row) {
    try {
        const policy = await db.InsurancePolicy.findByPk(row.policy_id);
        if (policy && policy.underwriter_id) await placement.notifyUnderwriter(row, policy);
    } catch { /* placement.notifyUnderwriter already logs; never block the claim */ }
}

/** Tell the assured a claim is open and exactly what it still needs. */
function announceFiled(row) {
    const required = Array.isArray(row.required_documents) ? row.required_documents : [];
    notify.notify('claim_filed', {
        tenantId: row.tenant_id, entityType: 'insurance_claim', entityId: row.id,
        ref: row.claim_number, money: notify.money(row.amount),
        detail: required.length ? `${required.length} documents are required before it can be reviewed.` : 'No further documents are required.',
    }).catch(() => {});
    if (required.length) {
        notify.notify('claim_evidence_required', {
            tenantId: row.tenant_id, entityType: 'insurance_claim', entityId: row.id,
            ref: row.claim_number, detail: required.join(', '),
        }).catch(() => {});
    }
}

/** tradeops incident type → the marine loss type a claim is adjusted under. */
function incidentToLossType(incident) {
    const severity = String(incident.severity || '');
    switch (String(incident.incident_type || '')) {
        case 'loss': return severity === 'critical' ? 'total_loss' : 'partial_loss';
        case 'damage': return severity === 'critical' ? 'total_loss' : 'damage';
        case 'theft': return 'theft';
        case 'delay': return 'delay';
        case 'accident': return severity === 'critical' ? 'total_loss' : 'damage';
        default: return 'damage';
    }
}

const fileClaim = async (req, res, next) => {
    try {
        const row = await createClaim({ body: req.body, req, incident: null });
        announceFiled(row);
        adviseUnderwriter(row).catch(() => {});
        return sendSuccess(req, res, claimToApi(row), 201);
    } catch (err) { return next(err); }
};

/**
 * POST /insurance_claims/from_incident — file a claim straight off a logged
 * incident. This is the link that was missing entirely: a container going over
 * the side produced an incident row that no insurance code path ever read.
 */
const fileClaimFromIncident = async (req, res, next) => {
    try {
        const b = req.body || {};
        const incidentId = b.incidentId || b.incident_id;
        if (!incidentId) return next(new AppError('BAD_REQUEST', 'incidentId is required', 400));

        const incident = await db.Incident.findByPk(incidentId);
        if (!incident) return next(new AppError('NOT_FOUND', 'Incident not found', 404));
        if (!isAdmin(req)) {
            const tenantId = callerTenantId(req);
            if (tenantId && incident.tenant_id && incident.tenant_id !== tenantId) {
                return next(new AppError('NOT_FOUND', 'Incident not found', 404));
            }
        }

        const existing = await db.InsuranceClaim.findOne({ where: { incident_id: incident.id, status: { [Op.notIn]: ['rejected', 'withdrawn'] } } });
        if (existing) {
            return next(new AppError('CLAIM_EXISTS', `claim ${existing.claim_number} is already open against this incident`, 409));
        }

        // Fall back to the policy covering the incident's shipment when none is named.
        let policyId = b.policyId || b.policy_id;
        if (!policyId) {
            const policy = await db.InsurancePolicy.findOne({ where: { shipment_id: incident.shipment_id, status: 'active' }, order: [['created_at', 'DESC']] });
            if (!policy) return next(new AppError('NO_ACTIVE_POLICY', 'no active policy covers this shipment — name a policyId explicitly', 409));
            policyId = policy.id;
        }

        const row = await createClaim({ body: { ...b, policyId }, req, incident });
        announceFiled(row);
        adviseUnderwriter(row).catch(() => {});
        return sendSuccess(req, res, claimToApi(row), 201);
    } catch (err) { return next(err); }
};

/** GET /insurance_claims/for_incident/:incidentId — what an incident already has open. */
const claimsForIncident = async (req, res, next) => {
    try {
        const where = { incident_id: req.params.incidentId };
        if (!isAdmin(req)) {
            const tenantId = callerTenantId(req);
            if (tenantId) where.tenant_id = tenantId;
        }
        const rows = await db.InsuranceClaim.findAll({ where, order: [['created_at', 'DESC']] });
        return sendSuccess(req, res, rows.map(claimToApi));
    } catch (err) { return next(err); }
};

const claimAction = (to) => async (req, res, next) => {
    try {
        const c = await fetchClaimOwned(req.params.id, req, next); if (!c) return undefined;
        assertClaim(c, to);
        const updates = { status: to };
        if (to === 'under_review') {
            const state = await evidence.refresh(c);
            if (!state.complete) {
                return next(new AppError('EVIDENCE_INCOMPLETE', `cannot review: missing ${state.missing.join(', ')}`, 409));
            }
            if (req.body && req.body.assessor) updates.assessor = req.body.assessor;
        }
        if (to === 'rejected') {
            updates.resolved_at = new Date();
            updates.metadata = { ...(c.metadata || {}), rejectReason: (req.body && req.body.reason) || null, rejectedBy: actorOf(req) };
        }
        if (to === 'withdrawn') {
            updates.resolved_at = new Date();
            updates.metadata = { ...(c.metadata || {}), withdrawnBy: actorOf(req) };
        }
        await c.update(updates);
        if (to === 'under_review') {
            notify.notify('claim_under_review', {
                tenantId: c.tenant_id, entityType: 'insurance_claim', entityId: c.id,
                ref: c.claim_number, detail: c.assessor || null,
            }).catch(() => {});
        }
        if (to === 'rejected') {
            notify.notify('claim_rejected', {
                tenantId: c.tenant_id, entityType: 'insurance_claim', entityId: c.id,
                ref: c.claim_number, detail: (req.body && req.body.reason) || null,
            }).catch(() => {});
        }
        if (to === 'evidence_required') {
            const state = await evidence.evaluate(c);
            notify.notify('claim_evidence_required', {
                tenantId: c.tenant_id, entityType: 'insurance_claim', entityId: c.id,
                ref: c.claim_number, detail: state.missing.join(', '),
            }).catch(() => {});
        }
        return sendSuccess(req, res, claimToApi(c));
    } catch (err) { return next(err); }
};

/**
 * POST /insurance_claims/:id/approve — adjust and authorise the settlement.
 * Refuses while evidence is outstanding, and the figure it authorises is the
 * settlement (capped at remaining cover, net of the deductible) rather than the
 * amount claimed.
 */
const approveClaim = async (req, res, next) => {
    try {
        const c = await fetchClaimOwned(req.params.id, req, next); if (!c) return undefined;
        assertClaim(c, 'approved');

        const state = await evidence.refresh(c);
        if (!state.complete) {
            return next(new AppError('EVIDENCE_INCOMPLETE', `cannot approve: missing ${state.missing.join(', ')}`, 409));
        }

        const policy = await db.InsurancePolicy.findByPk(c.policy_id);
        if (!policy) return next(new AppError('NOT_FOUND', 'Policy not found', 404));

        const b = req.body || {};
        const assessedLoss = b.assessedLoss != null ? b.assessedLoss : (b.payoutAmount != null ? b.payoutAmount : null);
        const s = await computeSettlement(c, policy, { assessedLoss });

        await c.update({
            status: 'approved',
            gross_loss: s.grossLoss,
            payout_amount: s.payout,
            deductible_applied: s.deductible,
            assessor: b.assessor || c.assessor || actorOf(req),
            metadata: { ...(c.metadata || {}), settlement: { ...s, approvedBy: actorOf(req), approvedAt: new Date().toISOString() } },
        });
        notify.notify('claim_approved', {
            tenantId: c.tenant_id, entityType: 'insurance_claim', entityId: c.id,
            ref: c.claim_number, money: notify.money(s.payout, policy.currency),
            detail: s.deductible > 0 ? `after a ${notify.money(s.deductible, policy.currency)} deductible` : null,
        }).catch(() => {});
        return sendSuccess(req, res, { ...claimToApi(c), settlement: s });
    } catch (err) { return next(err); }
};

// POST /insurance_claims/:id/pay — pay the approved settlement, then open recovery.
const payClaim = async (req, res, next) => {
    try {
        const c = await fetchClaimOwned(req.params.id, req, next); if (!c) return undefined;
        assertClaim(c, 'paid');

        const policy = await db.InsurancePolicy.findByPk(c.policy_id);
        // payout_amount is set by approve and is already net of the deductible; falling
        // back to the raw claim amount here would silently reintroduce the bug.
        const payout = num(c.payout_amount);
        if (payout <= 0) {
            await c.update({ status: 'paid', paid_at: new Date(), resolved_at: new Date(), payout_amount: 0 });
            return sendSuccess(req, res, { ...claimToApi(c), note: 'Loss fell within the deductible — nothing payable.' });
        }

        let payoutRef = `PAYOUT-${crypto.randomInt(100000, 999999)}`;
        if (config.finance.enabled) {
            try {
                const accounts = await accountsFor('payout', req, policy);
                const result = await initiatePayment({ ...accounts, amount: payout, currency: (policy && policy.currency) || 'USD', scheme: 'INTERNAL', metadata: { kind: 'insurance_payout', claimId: c.id, policyId: c.policy_id } },
                    { tenantId: req.tenantId, idempotencyKey: `payout-${c.id}` });
                payoutRef = refFromInitiate(result) || payoutRef;
            } catch (e) {
                return next(new AppError('FINANCE_UNAVAILABLE', `payout failed: ${e.message}`, e.status && e.status < 500 ? 400 : 502));
            }
        }

        // Having indemnified the assured, the insurer stands in their shoes against
        // whoever caused the loss. Opening this at payment is what stops the recovery
        // being forgotten until the carrier's time bar has run.
        const carrierRecoverable = ['damage', 'total_loss', 'partial_loss', 'theft', 'non_delivery'].includes(String(c.loss_type || ''));
        await c.update({
            status: 'paid',
            payout_ref: payoutRef,
            paid_at: new Date(),
            resolved_at: new Date(),
            subrogation_status: carrierRecoverable ? 'pending' : c.subrogation_status,
        });

        // A policy is only spent once its cover is exhausted; a partial loss leaves
        // the balance available for the rest of the voyage.
        if (policy) {
            const left = await remainingCoverage(policy);
            if (left <= 0) await policy.update({ status: 'claimed' });
        }
        notify.notify('claim_paid', {
            tenantId: c.tenant_id, entityType: 'insurance_claim', entityId: c.id,
            ref: c.claim_number, money: notify.money(payout, (policy && policy.currency) || 'USD'),
        }).catch(() => {});
        return sendSuccess(req, res, claimToApi(c));
    } catch (err) { return next(err); }
};

/**
 * POST /insurance_claims/:id/subrogation — record progress recovering the paid
 * loss from the carrier or another liable party.
 */
const recordSubrogation = async (req, res, next) => {
    try {
        const c = await fetchClaimOwned(req.params.id, req, next); if (!c) return undefined;
        if (c.status !== 'paid') {
            return next(new AppError('INVALID_TRANSITION', 'subrogation only applies once the claim has been paid', 409));
        }
        const b = req.body || {};
        const recovered = b.recovered != null ? num(b.recovered) : num(c.subrogation_recovered);
        const paid = num(c.payout_amount);

        let status = b.status;
        if (!status) {
            if (recovered <= 0) status = 'pending';
            else if (recovered >= paid) status = 'recovered';
            else status = 'partially_recovered';
        }
        if (!db.InsuranceClaim.SUBROGATION_STATUSES.includes(status)) {
            return next(new AppError('BAD_REQUEST', `unknown subrogation status '${status}'`, 400));
        }
        if (recovered > paid) {
            return next(new AppError('BAD_REQUEST', 'recovery cannot exceed the amount paid out', 400));
        }

        await c.update({
            subrogation_status: status,
            subrogation_recovered: recovered,
            subrogation_ref: b.reference || b.ref || c.subrogation_ref,
            metadata: { ...(c.metadata || {}), subrogationNote: b.note || (c.metadata || {}).subrogationNote, subrogationUpdatedBy: actorOf(req) },
        });
        return sendSuccess(req, res, claimToApi(c));
    } catch (err) { return next(err); }
};

/**
 * POST /insurance_claims/:id/underwriter_settlement — record what the carrier paid
 * on their own paper. Under a binder the broker often indemnifies the assured first
 * and collects afterwards, so this figure and its timing are tracked separately from
 * the payout.
 */
const recordUnderwriterSettlement = async (req, res, next) => {
    try {
        const c = await fetchClaimOwned(req.params.id, req, next); if (!c) return undefined;
        const policy = await db.InsurancePolicy.findByPk(c.policy_id);
        if (!policy || !policy.underwriter_id) {
            return next(new AppError('NOT_PLACED', 'this claim is on a platform-retained policy — there is no carrier to settle it', 409));
        }
        const b = req.body || {};
        if (b.amount == null) return next(new AppError('BAD_REQUEST', 'amount is required', 400));
        await placement.recordUnderwriterSettlement(c, { amount: b.amount, reference: b.reference, settledAt: b.settledAt });
        return sendSuccess(req, res, claimToApi(c));
    } catch (err) {
        return next(err instanceof AppError ? err : new AppError('BAD_REQUEST', err.message, 400));
    }
};

// ── claim evidence ───────────────────────────────────────────────────────────
function claimDocToApi(r) {
    return {
        id: r.id, claimId: r.claim_id, role: r.doc_role, documentId: r.document_id,
        title: r.title, status: r.status, note: r.note,
        uploadedBy: r.uploaded_by, reviewedBy: r.reviewed_by, reviewedAt: r.reviewed_at,
        createdAt: r.created_at, updatedAt: r.updated_at,
    };
}

const listClaimDocuments = async (req, res, next) => {
    try {
        const c = await fetchClaimOwned(req.params.id, req, next); if (!c) return undefined;
        return sendSuccess(req, res, await evidence.evaluate(c));
    } catch (err) { return next(err); }
};

/** POST /insurance_claims/:id/documents — attach a document engine row in a claim role. */
const attachClaimDocument = async (req, res, next) => {
    try {
        const c = await fetchClaimOwned(req.params.id, req, next); if (!c) return undefined;
        if (['paid', 'rejected', 'withdrawn'].includes(c.status)) {
            return next(new AppError('INVALID_TRANSITION', `cannot attach evidence to a '${c.status}' claim`, 409));
        }
        const b = req.body || {};
        const role = b.role || b.docRole || b.doc_role;
        if (!role) return next(new AppError('BAD_REQUEST', 'role is required', 400));
        if (!db.InsuranceClaimDocument.ROLES.includes(role)) {
            return next(new AppError('BAD_REQUEST', `unknown evidence role '${role}'`, 400));
        }
        const documentId = b.documentId || b.document_id;
        if (!documentId) return next(new AppError('BAD_REQUEST', 'documentId is required — upload the file through the document engine first', 400));

        const doc = await db.TradeDocument.findByPk(documentId);
        if (!doc) return next(new AppError('NOT_FOUND', 'Document not found', 404));

        const existing = await db.InsuranceClaimDocument.findOne({ where: { claim_id: c.id, doc_role: role } });
        if (existing) {
            await existing.update({ document_id: documentId, title: b.title || doc.title, status: 'attached', note: b.note || null, uploaded_by: actorOf(req), reviewed_by: null, reviewed_at: null });
        } else {
            await db.InsuranceClaimDocument.create({
                id: did(), tenant_id: c.tenant_id, claim_id: c.id, doc_role: role,
                document_id: documentId, title: b.title || doc.title, status: 'attached',
                note: b.note || null, uploaded_by: actorOf(req),
            });
        }

        const state = await evidence.refresh(c);
        // Once the file is complete the claim is ready for an adjuster to pick up.
        if (state.complete && c.status === 'evidence_required') await c.update({ status: 'filed' });
        return sendSuccess(req, res, { claim: claimToApi(c), evidence: state }, 201);
    } catch (err) { return next(err); }
};

/** PATCH /insurance_claims/:id/documents/:docId — adjuster verifies or rejects one piece of evidence. */
const reviewClaimDocument = async (req, res, next) => {
    try {
        const c = await fetchClaimOwned(req.params.id, req, next); if (!c) return undefined;
        const row = await db.InsuranceClaimDocument.findOne({ where: { id: req.params.docId, claim_id: c.id } });
        if (!row) return next(new AppError('NOT_FOUND', 'Evidence not found', 404));

        const status = (req.body && req.body.status) || 'verified';
        if (!db.InsuranceClaimDocument.STATUSES.includes(status)) {
            return next(new AppError('BAD_REQUEST', `unknown evidence status '${status}'`, 400));
        }
        await row.update({ status, note: (req.body && req.body.note) || row.note, reviewed_by: actorOf(req), reviewed_at: new Date() });

        const state = await evidence.refresh(c);
        // A rejected document reopens the file; the claim cannot sit in review on it.
        if (!state.complete && ['filed', 'under_review'].includes(c.status)) await c.update({ status: 'evidence_required' });
        return sendSuccess(req, res, { document: claimDocToApi(row), claim: claimToApi(c), evidence: state });
    } catch (err) { return next(err); }
};

const removeClaimDocument = async (req, res, next) => {
    try {
        const c = await fetchClaimOwned(req.params.id, req, next); if (!c) return undefined;
        if (['paid', 'rejected', 'withdrawn'].includes(c.status)) {
            return next(new AppError('INVALID_TRANSITION', `cannot alter evidence on a '${c.status}' claim`, 409));
        }
        const row = await db.InsuranceClaimDocument.findOne({ where: { id: req.params.docId, claim_id: c.id } });
        if (!row) return next(new AppError('NOT_FOUND', 'Evidence not found', 404));
        await row.destroy();
        const state = await evidence.refresh(c);
        if (!state.complete && ['filed', 'under_review'].includes(c.status)) await c.update({ status: 'evidence_required' });
        return sendSuccess(req, res, { claim: claimToApi(c), evidence: state });
    } catch (err) { return next(err); }
};

module.exports = {
    quote, listPolicies, getPolicy, createPolicy, bindPolicy, cancelPolicy, expirePolicies, summary,
    listClaims, getClaim, fileClaim, fileClaimFromIncident, claimsForIncident,
    assessClaim: claimAction('under_review'),
    requestEvidence: claimAction('evidence_required'),
    rejectClaim: claimAction('rejected'),
    withdrawClaim: claimAction('withdrawn'),
    approveClaim, payClaim, recordSubrogation, recordUnderwriterSettlement,
    listClaimDocuments, attachClaimDocument, reviewClaimDocument, removeClaimDocument,
    // exported for the general average controller
    policyToApi, claimToApi, isAdmin, callerTenantId, actorOf,
};
