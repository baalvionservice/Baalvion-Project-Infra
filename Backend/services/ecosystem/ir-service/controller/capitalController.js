'use strict';
// Thin controllers over service/capitalService. The subject is always the authenticated caller —
// an investor id is never read from the query or body, so one investor cannot address another's
// capital account by guessing an id.
const service = require('../service/capitalService');

const subject = (req) => (req.user && req.user.id) || (req.auth && (req.auth.userId || req.auth.sub));

const ok = (res, data) => res.json({ success: true, data, meta: { timestamp: Date.now() } });

exports.getSummary = async (req, res, next) => {
    try {
        const uid = subject(req);
        if (!uid) return res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED' } });
        // null = this account holds no commitment. The portal renders an empty state; it does
        // not substitute a placeholder position.
        return ok(res, await service.summaryFor(uid));
    } catch (err) { return next(err); }
};

exports.listCalls = async (req, res, next) => {
    try { return ok(res, await service.callsFor(subject(req))); } catch (err) { return next(err); }
};

exports.listDistributions = async (req, res, next) => {
    try { return ok(res, await service.distributionsFor(subject(req))); } catch (err) { return next(err); }
};

exports.listNavHistory = async (req, res, next) => {
    try { return ok(res, await service.navHistoryFor(subject(req))); } catch (err) { return next(err); }
};

// ── Operator side ─────────────────────────────────────────────────────────────
// Guarded by requireRole at the route; the service still refuses over-calls on its own.

exports.getRegister = async (req, res, next) => {
    try { return ok(res, await service.registerFor(req.query.vehicle || 'baalvion')); } catch (err) { return next(err); }
};

exports.issueCall = async (req, res, next) => {
    try {
        const call = await service.issueCall({
            vehicle: req.body.vehicle || 'baalvion',
            callPct: req.body.callPct,
            purpose: req.body.purpose,
            dueDate: req.body.dueDate,
            actorId: subject(req),
            orgId: (req.user && req.user.orgId) || (req.auth && req.auth.orgId),
        });
        return res.status(201).json({ success: true, data: call, meta: { timestamp: Date.now() } });
    } catch (err) {
        if (err.status) return res.status(err.status).json({ success: false, error: { code: 'CALL_REJECTED', message: err.message } });
        return next(err);
    }
};

exports.settleAllocation = async (req, res, next) => {
    try {
        // A settlement reference is mandatory: money is recorded as received against bank
        // evidence, never because an operator pressed a button.
        const ref = String(req.body.settlementRef || '').trim();
        if (!ref) {
            return res.status(400).json({ success: false, error: { code: 'SETTLEMENT_REF_REQUIRED', message: 'A bank settlement reference is required to record a receipt.' } });
        }
        const row = await service.recordSettlement({
            allocationId: req.params.allocationId, amount: req.body.amount,
            settlementRef: ref, actorId: subject(req), receivedOn: req.body.receivedOn,
        });
        if (!row) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
        return ok(res, row);
    } catch (err) {
        if (err.status) return res.status(err.status).json({ success: false, error: { code: 'SETTLEMENT_REJECTED', message: err.message } });
        return next(err);
    }
};

exports.declareDistribution = async (req, res, next) => {
    try {
        const result = await service.declareDistribution({
            vehicle: req.body.vehicle || 'baalvion', amount: req.body.amount,
            kind: req.body.kind, reference: req.body.reference,
            orgId: (req.user && req.user.orgId) || (req.auth && req.auth.orgId),
        });
        return res.status(201).json({ success: true, data: result, meta: { timestamp: Date.now() } });
    } catch (err) {
        if (err.status) return res.status(err.status).json({ success: false, error: { code: 'DISTRIBUTION_REJECTED', message: err.message } });
        return next(err);
    }
};

exports.payDistribution = async (req, res, next) => {
    try {
        const ref = String(req.body.settlementRef || '').trim();
        if (!ref) {
            return res.status(400).json({ success: false, error: { code: 'SETTLEMENT_REF_REQUIRED', message: 'A bank settlement reference is required to record a payment.' } });
        }
        const row = await service.payDistribution({ distributionId: req.params.distributionId, settlementRef: ref, paidOn: req.body.paidOn });
        if (!row) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
        return ok(res, row);
    } catch (err) {
        if (err.status) return res.status(err.status).json({ success: false, error: { code: 'DISTRIBUTION_REJECTED', message: err.message } });
        return next(err);
    }
};
