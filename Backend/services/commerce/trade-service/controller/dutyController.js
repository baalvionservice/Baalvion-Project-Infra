'use strict';
// Duty settlement — HTTP surface (Compression, Phase 5).
// Every mutating endpoint takes an idempotency key. That is not optional
// politeness here: the customs gateway retries, and a duplicated settle is real
// money leaving a real account.
const engine = require('../service/duty/dutyEngine');
const core = require('../service/duty/ledger');
const fx = require('../service/duty/fx');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const db = require('../models');

function isAdmin(req) {
    const roles = (req.auth && req.auth.roles) || [];
    return roles.some((r) => r === 'admin' || r === 'super_admin' || r === 'owner');
}
function callerTenantId(req) {
    return (req.auth && (req.auth.tenantId || req.auth.orgId)) || null;
}
function actorOf(req) {
    return (req.auth && (req.auth.userId || req.auth.email)) || 'system';
}
function scopeTenant(req) {
    return isAdmin(req) ? (req.query.tenant_id || null) : callerTenantId(req);
}

// A money movement without an idempotency key cannot be made safe, so it is
// refused rather than accepted on a promise that the caller will not retry.
function requireIdempotencyKey(req) {
    const key = req.get('Idempotency-Key') || (req.body && req.body.idempotency_key);
    if (!key) {
        throw new AppError('IDEMPOTENCY_KEY_REQUIRED',
            'Money movements require an Idempotency-Key header (or idempotency_key in the body). A retried settle without one is a double debit.',
            400);
    }
    return String(key);
}

function amountFrom(req) {
    const raw = (req.body || {}).amount_minor;
    if (raw === undefined || raw === null || !Number.isInteger(Number(raw))) {
        throw new AppError('VALIDATION_ERROR',
            'amount_minor is required and must be an integer in the account minor unit (e.g. 150000 for 1500.00 USD)', 400);
    }
    return Number(raw);
}

// ── GET /v1/duty/definition ──────────────────────────────────────────────────
const getDefinition = (req, res) => sendSuccess(req, res, {
    ledger_version: core.LEDGER_VERSION,
    fx_version: fx.FX_VERSION,
    account_types: core.ACCOUNT_TYPE,
    entry_types: core.ENTRY,
    non_standard_minor_units: fx.MINOR_UNITS,
    balance_formula: 'available = balance + credit_limit - reserved',
    note: 'An assessment RESERVES; a payment SETTLES. Amounts are integers in the account minor unit — no endpoint here accepts a decimal.',
});

const openAccount = async (req, res, next) => {
    try {
        const b = req.body || {};
        const row = await engine.openAccount({
            tenantId: scopeTenant(req),
            orgId: b.org_id,
            label: b.label,
            currency: b.currency,
            accountType: b.account_type,
            creditLimitMinor: b.credit_limit_minor,
            guaranteeReference: b.guarantee_reference,
            provider: b.provider,
            actor: actorOf(req),
        });
        return sendSuccess(req, res, row, 201);
    } catch (err) {
        return next(err);
    }
};

const listAccounts = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, org_id, status } = req.query;
        const where = {};
        const tenantId = scopeTenant(req);
        if (tenantId) where.tenant_id = tenantId;
        if (org_id) where.org_id = org_id;
        if (status) where.status = status;
        const p = Math.max(1, Number(page) || 1);
        const l = Math.min(100, Math.max(1, Number(limit) || 20));
        const { count, rows } = await db.DutyAccount.findAndCountAll({
            where, limit: l, offset: (p - 1) * l, order: [['created_at', 'DESC']],
        });
        return sendPaginated(req, res, { items: rows, total: count, page: p, limit: l });
    } catch (err) {
        return next(err);
    }
};

const getAccount = async (req, res, next) => {
    try {
        return sendSuccess(req, res, await engine.getAccount(req.params.id, {
            tenantId: scopeTenant(req), entryLimit: req.query.entries,
        }));
    } catch (err) {
        return next(err);
    }
};

// ── POST /v1/duty/accounts/:id/:movement ─────────────────────────────────────
// deposit | reserve | release | settle | refund | fee | adjust
const MOVEMENTS = new Set(['deposit', 'reserve', 'release', 'settle', 'refund', 'fee', 'adjust']);
const move = async (req, res, next) => {
    try {
        const { movement } = req.params;
        if (!MOVEMENTS.has(movement)) {
            throw new AppError('VALIDATION_ERROR', `Unknown movement: ${movement}`, 400, { known: [...MOVEMENTS] });
        }
        const b = req.body || {};
        const result = await engine[movement](req.params.id, amountFrom(req), {
            tenantId: scopeTenant(req),
            idempotencyKey: requireIdempotencyKey(req),
            consignmentId: b.consignment_id,
            submissionId: b.submission_id,
            fxLockId: b.fx_lock_id,
            reference: b.reference,
            description: b.description,
            actor: actorOf(req),
        });
        // A replayed call is reported as such rather than pretending to be new —
        // silently returning 201 twice hides a double-submit from the caller.
        return sendSuccess(req, res, result, result.replayed ? 200 : 201);
    } catch (err) {
        return next(err);
    }
};

const sufficiency = async (req, res, next) => {
    try {
        return sendSuccess(req, res, await engine.checkSufficiency(req.params.id, amountFrom(req), {
            tenantId: scopeTenant(req),
        }));
    } catch (err) {
        return next(err);
    }
};

const audit = async (req, res, next) => {
    try {
        return sendSuccess(req, res, await engine.audit(req.params.id, { tenantId: scopeTenant(req) }));
    } catch (err) {
        return next(err);
    }
};

// ── FX ───────────────────────────────────────────────────────────────────────
const createFxLock = async (req, res, next) => {
    try {
        const b = req.body || {};
        const row = await engine.createFxLock({
            tenantId: scopeTenant(req),
            consignmentId: b.consignment_id,
            baseCurrency: b.base_currency,
            quoteCurrency: b.quote_currency,
            rate: b.rate,
            ttlHours: b.ttl_hours,
            source: b.source,
            actor: actorOf(req),
        });
        return sendSuccess(req, res, row, 201);
    } catch (err) {
        return next(err);
    }
};

const convert = async (req, res, next) => {
    try {
        const b = req.body || {};
        return sendSuccess(req, res, await engine.convert(req.params.id, amountFrom(req), {
            tenantId: scopeTenant(req), direction: b.direction || 'base_to_quote',
        }));
    } catch (err) {
        return next(err);
    }
};

module.exports = {
    getDefinition, openAccount, listAccounts, getAccount, move, sufficiency, audit, createFxLock, convert,
};
