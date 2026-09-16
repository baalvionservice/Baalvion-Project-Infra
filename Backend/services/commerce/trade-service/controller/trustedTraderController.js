'use strict';
// Trusted trader — HTTP surface (Compression, Phase 6).
// Every response that carries a selection estimate also carries the disclaimer
// from the risk model. That is deliberate: this is the endpoint most easily
// turned into a promise the platform cannot keep.
const engine = require('../service/trustedTrader/traderEngine');
const programmes = require('../service/trustedTrader/programmes');
const assessment = require('../service/trustedTrader/assessment');
const risk = require('../service/trustedTrader/risk');
const consignmentEngine = require('../service/consignment/consignmentEngine');
const cSchema = require('../service/consignment/schema');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

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

// ── GET /v1/trusted_trader/programmes ────────────────────────────────────────
// The published catalogue: criteria, benefits and mutual-recognition reach.
// Public — which accreditation is worth pursuing is a decision a prospect should
// be able to make before signing up.
const getProgrammes = (req, res) => sendSuccess(req, res, {
    programme_version: programmes.PROGRAMME_VERSION,
    assessment_version: assessment.ASSESSMENT_VERSION,
    criteria: programmes.CRITERIA,
    programmes: programmes.PROGRAMMES,
    evidence_statuses: assessment.EVIDENCE_STATUS,
    note: 'Accreditation is granted by an authority after its own audit. The platform measures readiness, holds the evidence, and keeps the compliance record clean — it does not grant status.',
});

// ── POST /v1/trusted_trader/recommend ────────────────────────────────────────
// Which programme first, given where this trader actually ships.
const recommend = (req, res, next) => {
    try {
        const { home_country, destination_volumes } = req.body || {};
        if (!home_country) throw new AppError('VALIDATION_ERROR', 'home_country is required', 400);
        const ranked = programmes.recommend(home_country, destination_volumes || {});
        return sendSuccess(req, res, {
            home_country,
            recommendations: ranked,
            // A programme covering none of the trader's destinations is worse than
            // no advice, so the absence is stated rather than left implicit.
            note: ranked.length && ranked[0].coverage_pct === 0
                ? `No programme available in ${home_country} is recognised in any of these destinations. On those lanes, the importer of record must be accredited locally instead.`
                : null,
        });
    } catch (err) {
        return next(err);
    }
};

// ── POST /v1/trusted_trader/assess ───────────────────────────────────────────
// Readiness against one programme's criteria, without persisting.
const assess = (req, res, next) => {
    try {
        const { programme, evidence, held_programmes } = req.body || {};
        if (!programme) throw new AppError('VALIDATION_ERROR', 'programme is required', 400);
        return sendSuccess(req, res, assessment.assess(programme, evidence || {}, {
            heldProgrammes: held_programmes || [],
        }));
    } catch (err) {
        return next(new AppError('UNKNOWN_PROGRAMME', err.message, 400));
    }
};

// ── GET /v1/trusted_trader/:org_id/readiness ─────────────────────────────────
const readiness = async (req, res, next) => {
    try {
        const homeCountry = req.query.home_country;
        if (!homeCountry) throw new AppError('VALIDATION_ERROR', 'home_country query parameter is required', 400);
        const view = await engine.readiness(req.params.org_id, homeCountry, { tenantId: scopeTenant(req) });
        return sendSuccess(req, res, view);
    } catch (err) {
        return next(err);
    }
};

const listAccreditations = async (req, res, next) => {
    try {
        const rows = await engine.accreditationsFor(req.params.org_id, { tenantId: scopeTenant(req) });
        return sendSuccess(req, res, { org_id: req.params.org_id, accreditations: rows });
    } catch (err) {
        return next(err);
    }
};

const upsertAccreditation = async (req, res, next) => {
    try {
        const b = req.body || {};
        const row = await engine.upsertAccreditation(req.params.org_id, {
            tenantId: scopeTenant(req),
            programme: b.programme,
            status: b.status,
            reference: b.reference,
            grantedAt: b.granted_at,
            expiresAt: b.expires_at,
            evidence: b.evidence || {},
            actor: actorOf(req),
        });
        return sendSuccess(req, res, row, 201);
    } catch (err) {
        return next(err);
    }
};

// ── POST /v1/trusted_trader/:org_id/recompute ────────────────────────────────
// Rebuild the profile from observed history. Nothing here is self-declared.
const recompute = async (req, res, next) => {
    try {
        return sendSuccess(req, res, await engine.recomputeProfile(req.params.org_id, { tenantId: scopeTenant(req) }));
    } catch (err) {
        return next(err);
    }
};

// ── POST /v1/trusted_trader/:org_id/selection_risk ───────────────────────────
const selectionRisk = async (req, res, next) => {
    try {
        const b = req.body || {};
        let canonical;
        if (b.consignment_id) {
            const view = await consignmentEngine.get(b.consignment_id, { tenantId: scopeTenant(req) });
            canonical = view.consignment.canonical;
        } else if (b.consignment) {
            canonical = cSchema.normalize(b.consignment);
        } else {
            throw new AppError('VALIDATION_ERROR', 'Provide either consignment_id or an inline consignment', 400);
        }
        const view = await engine.estimateRisk(req.params.org_id, canonical, { tenantId: scopeTenant(req) });
        return sendSuccess(req, res, view);
    } catch (err) {
        return next(err);
    }
};

// ── POST /v1/trusted_trader/:org_id/examinations ─────────────────────────────
// An examination outcome persists on the trader record for years, so it is
// recorded explicitly rather than inferred.
const recordExamination = async (req, res, next) => {
    try {
        const row = await engine.recordExamination(req.params.org_id, {
            tenantId: scopeTenant(req),
            foundDiscrepancy: (req.body || {}).found_discrepancy === true,
        });
        return sendSuccess(req, res, row, 201);
    } catch (err) {
        return next(err);
    }
};

// ── GET /v1/trusted_trader/channels ──────────────────────────────────────────
const getChannels = (req, res) => sendSuccess(req, res, {
    risk_version: risk.RISK_VERSION,
    channels: risk.CHANNEL,
    base_selection_rate: risk.BASE_SELECTION_RATE,
    chapter_risk: risk.CHAPTER_RISK,
    disclaimer: 'Estimates only. Customs authorities do not publish selection algorithms and do not commit to examination rates.',
});

module.exports = {
    getProgrammes, recommend, assess, readiness, listAccreditations, upsertAccreditation,
    recompute, selectionRisk, recordExamination, getChannels,
};
