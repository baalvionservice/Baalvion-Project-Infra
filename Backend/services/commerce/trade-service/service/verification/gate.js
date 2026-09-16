'use strict';
/**
 * Verification gating — turns KYC from a form that fills a table into a permission.
 *
 * Until now nothing in this service consulted a verification record before letting
 * a caller act: an account that had never submitted KYC could book a container and
 * bind an insurance policy that charges a real premium. The verification state
 * machines (service/verification/identity.js, company.js) were complete and
 * completely unreferenced.
 *
 * Levels, each strictly containing the one before it:
 *   none      nothing approved
 *   identity  a natural person behind the account is verified (KYC)
 *   business  the organization itself is verified too (KYB)
 *   full      every checklist category approved, trust score clear, no open
 *             high/critical fraud signal — i.e. the verified badge
 *
 * The level is computed from the same records the compliance admin reviews, and an
 * expired verification silently stops counting, so cover does not survive a lapsed
 * KYC refresh cycle.
 */
const { Op } = require('sequelize');
const db = require('../../models');

const LEVELS = ['none', 'identity', 'business', 'full'];
const rank = (level) => Math.max(0, LEVELS.indexOf(level));

// Identity verifications carry an expiry (the AML re-verification cycle in
// config.verification); company verifications do not have the column, so their
// lapse is expressed by the monitor sweep writing status='expired'.
const LIVE_IDENTITY = () => ({
    status: 'approved',
    [Op.or]: [{ expires_at: null }, { expires_at: { [Op.gt]: new Date() } }],
});
const LIVE_COMPANY = () => ({ status: 'approved' });

/**
 * @returns {{level:string, identity:boolean, business:boolean, badge:boolean,
 *            orgId:number|null, reasons:string[]}}
 */
async function levelFor({ orgId, userId, tenantId }) {
    const reasons = [];

    // req.auth.orgId is the auth-service org UUID, NOT trade.organizations.id (an
    // INTEGER) — resolving it as a primary key is the mistake to avoid here. The
    // tenant column is the join that actually works.
    let org = null;
    if (orgId != null && /^\d+$/.test(String(orgId))) org = await db.Organization.findByPk(Number(orgId));
    if (!org) {
        const tenant = tenantId || orgId;
        if (tenant) org = await db.Organization.findOne({ where: { tenant_id: String(tenant) }, order: [['id', 'ASC']] });
    }
    if (!org) {
        return { level: 'none', identity: false, business: false, badge: false, orgId: null, reasons: ['no organization on this platform — complete company onboarding first'] };
    }

    // Identity: this user's own approved KYC, or any approved KYC for the org (a
    // company acts through whichever of its verified officers is signed in).
    let identity = (await db.IdentityVerification.count({ where: { ...LIVE_IDENTITY(), org_id: org.id } })) > 0;
    if (!identity && userId != null && /^\d+$/.test(String(userId))) {
        identity = (await db.IdentityVerification.count({ where: { ...LIVE_IDENTITY(), user_id: Number(userId) } })) > 0;
    }
    if (!identity) reasons.push('no approved identity verification (KYC)');

    const business = (await db.CompanyVerification.count({ where: { ...LIVE_COMPANY(), org_id: org.id } })) > 0;
    if (!business) reasons.push('no approved company verification (KYB)');

    const badge = Boolean(org.verified_badge);
    if (!badge) reasons.push('the organization has not earned the verified badge');

    let level = 'none';
    if (identity) level = 'identity';
    if (identity && business) level = 'business';
    if (identity && business && badge) level = 'full';

    return { level, identity, business, badge, orgId: org.id, reasons };
}

/** Does this caller meet `required`? */
async function meets(required, ctx) {
    const state = await levelFor(ctx);
    return { ...state, required, ok: rank(state.level) >= rank(required) };
}

module.exports = { levelFor, meets, LEVELS, rank };
