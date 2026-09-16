'use strict';
/**
 * Claiming a compiled profile.
 *
 * Submission is deliberately unauthenticated — the person claiming a firm has no account here yet,
 * and requiring one first is the wall that kept this directory read-only. What protects it instead:
 * a work-email check (free webmail is rejected, since anyone can open a gmail account in a firm's
 * name), one live claim per profile, and a human review step before anything on the profile changes.
 *
 * Approval is what grants ownership. Nothing a claimant types is published on approval — the review
 * queue exists so a person decides, and the claim record keeps who asked and when.
 */
const crypto = require('crypto');
const db = require('./../models');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

const FREE_EMAIL = new Set([
    'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.uk', 'hotmail.com', 'outlook.com',
    'live.com', 'msn.com', 'aol.com', 'icloud.com', 'me.com', 'mac.com', 'proton.me',
    'protonmail.com', 'gmx.com', 'yandex.com', 'mail.com', 'zoho.com', 'qq.com', '163.com',
]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const hashIp = (ip) => crypto.createHash('sha256').update(String(ip || '')).digest('hex').slice(0, 32);

const MODELS = { investor: () => db.Investor, company: () => db.Company };

async function createClaim(req, res, next) {
    try {
        const b = req.body || {};
        const entityType = String(b.entity_type || '').toLowerCase();
        const model = MODELS[entityType]?.();
        if (!model) throw new AppError('VALIDATION', 'entity_type must be "investor" or "company"', 400);

        const entity = await model.findByPk(String(b.entity_id || ''));
        if (!entity || entity.is_hidden) throw new AppError('NOT_FOUND', 'Profile not found', 404);
        if (entity.claimed_at) throw new AppError('CONFLICT', 'This profile has already been claimed.', 409);

        const name = String(b.claimant_name || '').trim();
        const email = String(b.claimant_email || '').trim().toLowerCase();
        if (name.length < 2) throw new AppError('VALIDATION', 'Your name is required', 400);
        if (!EMAIL_RE.test(email)) throw new AppError('VALIDATION', 'A valid email address is required', 400);

        const domain = email.split('@')[1];
        if (FREE_EMAIL.has(domain)) {
            throw new AppError('VALIDATION',
                'Please use your work email address. A free webmail account cannot show you are connected to this firm.', 400);
        }

        try {
            const claim = await db.ProfileClaim.create({
                entity_type: entityType,
                entity_id: entity.id,
                entity_name: entity.name,
                claimant_name: name,
                claimant_email: email,
                claimant_role: String(b.claimant_role || '').trim() || null,
                claimant_phone: String(b.claimant_phone || '').trim() || null,
                evidence_url: String(b.evidence_url || '').trim() || null,
                message: String(b.message || '').trim().slice(0, 2000) || null,
                ip_hash: hashIp(req.headers['x-forwarded-for'] || req.ip),
            });
            return sendSuccess(req, res, {
                claim: { id: claim.id, status: claim.status },
                message: 'Claim received. We review each one by hand and will email you at the address you gave.',
            }, 201);
        } catch (e) {
            // The partial unique index means a second pending claim on the same profile collides.
            if (e?.name === 'SequelizeUniqueConstraintError') {
                throw new AppError('CONFLICT', 'A claim on this profile is already under review.', 409);
            }
            throw e;
        }
    } catch (e) { return next(e); }
}

// ── Admin ─────────────────────────────────────────────────────────────────────────────────
async function listClaims(req, res, next) {
    try {
        const status = String(req.query.status || 'pending');
        const claims = await db.ProfileClaim.findAll({
            where: status === 'all' ? {} : { status },
            order: [['created_at', 'DESC']],
            limit: 200,
        });
        return sendSuccess(req, res, { claims });
    } catch (e) { return next(e); }
}

async function reviewClaim(req, res, next) {
    try {
        const decision = String(req.body?.status || '').toLowerCase();
        if (!['approved', 'rejected'].includes(decision)) {
            throw new AppError('VALIDATION', 'status must be "approved" or "rejected"', 400);
        }
        const claim = await db.ProfileClaim.findByPk(req.params.id);
        if (!claim) throw new AppError('NOT_FOUND', 'Claim not found', 404);
        if (claim.status !== 'pending') throw new AppError('CONFLICT', 'This claim has already been reviewed.', 409);

        await claim.update({
            status: decision,
            review_note: String(req.body?.review_note || '').trim() || null,
            reviewed_by: req.user?.id || null,
            reviewed_at: new Date(),
        });

        if (decision === 'approved') {
            const model = MODELS[claim.entity_type]?.();
            // Ownership is the only thing approval grants. Contact details the claimant supplied are
            // NOT written onto the profile here — they go through the normal edit path afterwards,
            // so nothing reaches the public page without a person having looked at it.
            if (model) await model.update({ claimed_at: new Date(), claimed_by: claim.claimant_email }, { where: { id: claim.entity_id }, hooks: false });
        }
        return sendSuccess(req, res, { claim });
    } catch (e) { return next(e); }
}

module.exports = { createClaim, listClaims, reviewClaim };
