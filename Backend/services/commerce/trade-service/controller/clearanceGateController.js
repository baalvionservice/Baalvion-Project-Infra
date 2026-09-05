'use strict';
// Clearance gates + parallel work front — HTTP surface (Compression, Phase 3).
// The status endpoint is the one an operations screen polls: it answers "what can
// be worked on right now", "what is holding this up" and "when will it clear",
// which between them replace the linear stage-by-stage view.
const gateEngine = require('../service/clearance/gateEngine');
const gate = require('../service/clearance/gate');
const { sendSuccess } = require('../utils/response');

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

// Signals the platform does not own yet may be supplied explicitly. They are
// never inferred — an unknown signal must fail its gate, not pass it.
function overridesFrom(req) {
    const b = req.body || {};
    const out = {};
    for (const k of ['duty_assessed', 'duty_amount_minor', 'duty_funded', 'exam_required', 'exam_completed', 'trusted_trader']) {
        if (b[k] !== undefined) out[k] = b[k];
    }
    return out;
}

// ── GET /v1/clearance_gates/definition ───────────────────────────────────────
const getDefinition = (req, res) => sendSuccess(req, res, {
    gate_version: gate.GATE_VERSION,
    gates: Object.fromEntries(Object.entries(gate.GATES).map(([name, g]) => [name, {
        label: g.label,
        conditions: g.conditions.map((c) => ({ key: c.key, reason: c.reason, fix: c.fix })),
        soft_signals: (g.soft || []).map((c) => ({ key: c.key, reason: c.reason })),
    }])),
    model_parallelism: gate.parallelismFactor([]),
    note: 'A readiness score never opens a gate on its own. The hard conditions decide; the score is reported as a fragility signal.',
});

// ── GET /v1/clearance_gates/:consignment_id ──────────────────────────────────
const getStatus = async (req, res, next) => {
    try {
        const view = await gateEngine.status(req.params.consignment_id, {
            tenantId: scopeTenant(req),
            overrides: overridesFrom(req),
        });
        return sendSuccess(req, res, view);
    } catch (err) {
        return next(err);
    }
};

// ── POST /v1/clearance_gates/:consignment_id/advance ─────────────────────────
// Open a clock on every stage that is workable right now — the fan-out itself.
const advance = async (req, res, next) => {
    try {
        const result = await gateEngine.advance(req.params.consignment_id, {
            tenantId: scopeTenant(req),
            actor: actorOf(req),
            overrides: overridesFrom(req),
        });
        return sendSuccess(req, res, result);
    } catch (err) {
        return next(err);
    }
};

// ── POST /v1/clearance_gates/:consignment_id/evaluate/:gate ──────────────────
const evaluateOne = async (req, res, next) => {
    try {
        const { signals } = await gateEngine.collectSignals(req.params.consignment_id, {
            tenantId: scopeTenant(req),
            overrides: overridesFrom(req),
        });
        return sendSuccess(req, res, gate.evaluateGate(req.params.gate, signals));
    } catch (err) {
        return next(err);
    }
};

module.exports = { getDefinition, getStatus, advance, evaluateOne };
