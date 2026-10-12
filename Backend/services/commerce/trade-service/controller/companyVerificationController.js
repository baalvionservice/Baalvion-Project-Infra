'use strict';
/**
 * Company Verification — HTTP surface (Phase 2 Trust/Verification/Compliance
 * Foundation, Step 3). One record per organization, addressed by org_id.
 */
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { recordAudit } = require('../utils/audit');
const { isAdmin, fetchOrgOwned, actorOf } = require('../service/verification/access');
const companySvc = require('../service/verification/company');
const gleif = require('../service/verification/registries/gleif');

// Look-ups are answered from a short in-process cache: the same company is typed by
// many people, and the public register is not ours to hammer.
const LOOKUP_TTL_MS = 10 * 60 * 1000;
const LOOKUP_MAX = 500;
const lookupCache = new Map();
async function cached(key, load) {
    const hit = lookupCache.get(key);
    if (hit && Date.now() - hit.at < LOOKUP_TTL_MS) return hit.value;
    const value = await load();
    if (value && value.ok) {
        if (lookupCache.size >= LOOKUP_MAX) lookupCache.delete(lookupCache.keys().next().value);
        lookupCache.set(key, { at: Date.now(), value });
    }
    return value;
}

// GET /v1/company_verifications/lookup/suggest?q=  — type-ahead so nobody types a full legal name.
const suggestCompanies = async (req, res, next) => {
    try {
        const q = String(req.query.q || '').trim();
        if (q.length < 3) return sendSuccess(req, res, { suggestions: [] });
        const r = await cached(`s:${q.toLowerCase()}`, () => gleif.suggest(q));
        // A register outage degrades to "no suggestions"; the customer just types it.
        return sendSuccess(req, res, { suggestions: r.ok ? r.suggestions : [], available: r.ok });
    } catch (err) { return next(err); }
};

// GET /v1/company_verifications/lookup/entity?lei=  — the details to pre-fill the form.
const lookupCompany = async (req, res, next) => {
    try {
        const lei = String(req.query.lei || '').trim().toUpperCase();
        if (!/^[A-Z0-9]{20}$/.test(lei)) throw new AppError('VALIDATION_ERROR', 'lei must be a 20-character LEI', 400);
        const r = await cached(`e:${lei}`, () => gleif.byLei(lei));
        if (!r.ok) return sendSuccess(req, res, { available: false, entity: null });
        return sendSuccess(req, res, { available: true, entity: r.found ? r.entity : null });
    } catch (err) { return next(err); }
};

const submitCompanyVerification = async (req, res, next) => {
    try {
        const orgId = Number(req.params.orgId);
        const org = await fetchOrgOwned(orgId, req, next);
        if (!org) return undefined;

        const {
            legal_company_name = null, registration_number = null, incorporation_date = null,
            business_type = null, company_website = null, authorized_representative_user_id = null,
            metadata = undefined,
        } = req.body || {};

        const record = await companySvc.submitCompanyVerification({
            orgId, tenantId: org.tenant_id, actor: actorOf(req),
            legal_company_name, registration_number, incorporation_date, business_type,
            company_website, authorized_representative_user_id,
            // Supplementary fields not yet promoted to first-class columns (e.g. HQ address
            // text, tax residency) — an opaque JSONB bag, not schema-validated.
            ...(metadata && typeof metadata === 'object' ? { metadata } : {}),
        });

        await recordAudit({
            actorId: actorOf(req), action: 'company_verification.submitted', resourceType: 'company_verification',
            resourceId: record.id, tenantId: org.tenant_id, metadata: { orgId },
        });

        return sendSuccess(req, res, record, 201);
    } catch (err) {
        return next(err);
    }
};

const getCompanyVerification = async (req, res, next) => {
    try {
        const orgId = Number(req.params.orgId);
        const org = await fetchOrgOwned(orgId, req, next);
        if (!org) return undefined;
        const record = await db.CompanyVerification.findOne({ where: { org_id: orgId } });
        if (!record) return next(new AppError('NOT_FOUND', 'No company verification on file', 404));
        return sendSuccess(req, res, record);
    } catch (err) {
        return next(err);
    }
};

const listCompanyVerifications = async (req, res, next) => {
    try {
        if (!isAdmin(req)) return next(new AppError('FORBIDDEN', 'Admin or reviewer role required', 403));
        const { status, page = 1, limit = 20 } = req.query;
        const where = {};
        if (status) where.status = status;
        const offset = (Number(page) - 1) * Number(limit);
        const { count, rows } = await db.CompanyVerification.findAndCountAll({
            where, limit: Number(limit), offset, order: [['created_at', 'DESC']],
        });
        return sendPaginated(req, res, { items: rows, total: count, page: Number(page), limit: Number(limit) });
    } catch (err) {
        return next(err);
    }
};

async function reviewDecision(req, res, next, decision) {
    if (!isAdmin(req)) return next(new AppError('FORBIDDEN', 'Admin or reviewer role required', 403));
    const orgId = Number(req.params.orgId);
    const record = await db.CompanyVerification.findOne({ where: { org_id: orgId } });
    if (!record) return next(new AppError('NOT_FOUND', 'No company verification on file', 404));
    // Same contract as identity: undefined ⇒ apply the configured KYB validity window,
    // explicit null ⇒ no renewal date.
    const { rejection_reason = null, renewal_due_at } = req.body || {};
    await companySvc.reviewCompanyVerification({ record, decision, reviewedBy: actorOf(req), rejectionReason: rejection_reason, renewalDueAt: renewal_due_at });
    await recordAudit({
        actorId: actorOf(req), action: `company_verification.${decision}`, resourceType: 'company_verification',
        resourceId: record.id, tenantId: record.tenant_id, metadata: { orgId, rejectionReason: rejection_reason },
    });
    return sendSuccess(req, res, record);
}
const approveCompanyVerification = (req, res, next) => reviewDecision(req, res, next, 'approved').catch(next);
const rejectCompanyVerification = (req, res, next) => reviewDecision(req, res, next, 'rejected').catch(next);

module.exports = {
    suggestCompanies,
    lookupCompany,
    submitCompanyVerification, getCompanyVerification, listCompanyVerifications,
    approveCompanyVerification, rejectCompanyVerification,
};
