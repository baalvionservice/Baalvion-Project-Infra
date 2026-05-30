'use strict';
/**
 * Public, UNAUTHENTICATED, SEO-safe reads for the Next.js public site (Frontend/insiders-seo).
 * Returns ONLY a curated subset — NEVER contact PII (email/phone), financials (raise/valuation/AUM/
 * check size), pitch decks or data rooms. Investor profiles include recent PUBLIC investments, which
 * is the platform's core "which investors recently funded what" discovery signal for founders.
 */
const { Op } = require('sequelize');
const db = require('../models');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

const slugify = (s) => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
const withSlug = (base, id) => `${slugify(base) || 'profile'}-${String(id).slice(0, 8)}`;

// ── Founders (curated) ──────────────────────────────────────────────────────────
const FOUNDER_COLS = ['id', 'username', 'full_name', 'avatar_url', 'bio', 'company_name', 'company_about', 'headline', 'sector', 'stage', 'region', 'website', 'linkedin_url', 'updated_at'];
const publicFounder = (p) => {
    const o = {};
    for (const k of FOUNDER_COLS) o[k] = p[k] ?? null;
    o.slug = withSlug(p.company_name || p.full_name || p.username, p.id);
    return o;
};

async function listFounders(req, res, next) {
    try {
        const rows = await db.Profile.findAll({
            where: { role: 'founder', company_name: { [Op.ne]: null } },
            attributes: FOUNDER_COLS,
            order: [['updated_at', 'DESC']],
            limit: 2000,
        });
        return sendSuccess(req, res, { founders: rows.map(publicFounder) });
    } catch (e) { return next(e); }
}

async function getFounder(req, res, next) {
    try {
        const p = await db.Profile.findOne({ where: { id: req.params.id }, attributes: FOUNDER_COLS });
        if (!p) throw new AppError('NOT_FOUND', 'Founder not found', 404);
        return sendSuccess(req, res, { founder: publicFounder(p) });
    } catch (e) { return next(e); }
}

// ── Investors (curated + recent investments) ──────────────────────────────────────
const INVESTOR_COLS = ['id', 'name', 'firm', 'title', 'avatar_url', 'thesis', 'focus_sectors', 'stages', 'region', 'firm_type', 'location', 'website', 'linkedin_url', 'deals_backed', 'is_verified', 'updated_at'];
const publicInvestor = (i) => {
    const o = {};
    for (const k of INVESTOR_COLS) o[k] = i[k] ?? null;
    o.slug = withSlug(i.firm || i.name, i.id);
    return o;
};

async function listInvestors(req, res, next) {
    try {
        const rows = await db.Investor.findAll({
            attributes: INVESTOR_COLS,
            order: [['deals_backed', 'DESC'], ['updated_at', 'DESC']],
            limit: 5000,
        });
        return sendSuccess(req, res, { investors: rows.map(publicInvestor) });
    } catch (e) { return next(e); }
}

async function getInvestor(req, res, next) {
    try {
        const i = await db.Investor.findByPk(req.params.id, { attributes: INVESTOR_COLS });
        if (!i) throw new AppError('NOT_FOUND', 'Investor not found', 404);
        const investments = await db.Investment.findAll({
            where: { investor_id: i.id },
            attributes: ['target_company', 'round', 'amount_usd', 'invested_on', 'source_name', 'source_url'],
            order: [['invested_on', 'DESC']],
            limit: 25,
        });
        return sendSuccess(req, res, { investor: { ...publicInvestor(i), recent_investments: investments } });
    } catch (e) { return next(e); }
}

module.exports = { listFounders, getFounder, listInvestors, getInvestor };
