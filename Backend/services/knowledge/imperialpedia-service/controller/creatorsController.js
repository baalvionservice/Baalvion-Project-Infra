'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');

const buildPagination = (total, page, limit) => ({
    total, page, limit, totalPages: Math.ceil(total / limit),
});

// GET /creators — public, ordered by reputation_score DESC
const listCreators = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const offset = (page - 1) * limit;
        const where = {};

        if (req.query.is_verified !== undefined) {
            where.is_verified = req.query.is_verified === 'true';
        }

        const { count, rows } = await db.CreatorProfile.findAndCountAll({
            where,
            limit,
            offset,
            order: [['reputation_score', 'DESC']],
        });

        return sendPaginated(req, res, { items: rows, pagination: buildPagination(count, page, limit) });
    } catch (err) { return next(err); }
};

// GET /creators/:userId — public
const getCreator = async (req, res, next) => {
    try {
        const userId = parseInt(req.params.userId);
        const creator = await db.CreatorProfile.findOne({ where: { user_id: userId } });
        if (!creator) return next(new AppError('NOT_FOUND', 'Creator profile not found', 404));

        // Include recent articles
        const recentArticles = await db.Article.findAll({
            where: { author_id: userId, status: 'published' },
            limit: 5,
            order: [['published_at', 'DESC']],
        });

        return sendSuccess(req, res, { ...creator.toJSON(), recent_articles: recentArticles });
    } catch (err) { return next(err); }
};

// POST /creators/me — auth, upsert creator profile for req.user.id
const updateCreator = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { display_name, bio, avatar_url, specialization, social_links } = req.body;

        const [profile, created] = await db.CreatorProfile.findOrCreate({
            where: { user_id: userId },
            defaults: {
                user_id: userId,
                display_name: display_name || null,
                bio: bio || null,
                avatar_url: avatar_url || null,
                specialization: specialization || [],
                social_links: social_links || {},
            },
        });

        if (!created) {
            const updates = {};
            if (display_name !== undefined) updates.display_name = display_name;
            if (bio !== undefined) updates.bio = bio;
            if (avatar_url !== undefined) updates.avatar_url = avatar_url;
            if (specialization !== undefined) updates.specialization = specialization;
            if (social_links !== undefined) updates.social_links = social_links;
            await profile.update(updates);
        }

        return sendSuccess(req, res, profile, created ? 201 : 200);
    } catch (err) { return next(err); }
};

// GET /creators/:userId/articles — public
const getCreatorArticles = async (req, res, next) => {
    try {
        const userId = parseInt(req.params.userId);
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const offset = (page - 1) * limit;

        const { count, rows } = await db.Article.findAndCountAll({
            where: { author_id: userId, status: 'published' },
            limit,
            offset,
            order: [['published_at', 'DESC']],
        });

        return sendPaginated(req, res, { items: rows, pagination: buildPagination(count, page, limit) });
    } catch (err) { return next(err); }
};

// ── Creator verification (admin workflow) ─────────────────────────────────────
// Verification state lives in creator_profiles.meta.verification (no schema change).
const ADMIN_ROLES = ['admin', 'owner', 'super_admin'];
const isAdmin = (req) => (req.auth?.roles || []).some((r) => ADMIN_ROLES.includes(r));

const toVerification = (c) => {
    const v = (c.meta && c.meta.verification) || {};
    return {
        creatorId: String(c.user_id),
        creatorName: c.display_name || `Creator ${c.user_id}`,
        creatorAvatar: c.avatar_url || '',
        verified: !!c.is_verified,
        requestedAt: v.requestedAt,
        approvedAt: v.approvedAt,
        approverId: v.approverId,
        status: c.is_verified ? 'verified' : (v.status || 'unverified'),
        documentsProvided: v.documentsProvided || [],
        rejectionReason: v.rejectionReason,
    };
};

// GET /creators/verifications/pending — admin: creators awaiting verification
const listPendingVerifications = async (req, res, next) => {
    try {
        if (!isAdmin(req)) return next(new AppError('FORBIDDEN', 'Admin access required', 403));
        const rows = await db.CreatorProfile.findAll({
            where: db.sequelize.literal("meta->'verification'->>'status' = 'pending'"),
            order: [['updated_at', 'ASC']],
        });
        return sendSuccess(req, res, rows.map(toVerification));
    } catch (err) { return next(err); }
};

// GET /creators/:userId/verification — verification status for a creator
const getVerificationStatus = async (req, res, next) => {
    try {
        const uid = parseInt(req.params.userId);
        const creator = Number.isNaN(uid) ? null : await db.CreatorProfile.findOne({ where: { user_id: uid } });
        // A user without a creator profile (or unknown id) is simply 'unverified' — return a
        // valid object (200), never 404, so the verification UI always has something to render.
        if (!creator) {
            return sendSuccess(req, res, {
                creatorId: String(req.params.userId),
                creatorName: '',
                creatorAvatar: '',
                verified: false,
                status: 'unverified',
                documentsProvided: [],
            });
        }
        return sendSuccess(req, res, toVerification(creator));
    } catch (err) { return next(err); }
};

// POST /creators/me/verification/request — auth: the creator applies for verification
const requestVerification = async (req, res, next) => {
    try {
        const creator = await db.CreatorProfile.findOne({ where: { user_id: req.user.id } });
        if (!creator) return next(new AppError('NOT_FOUND', 'Creator profile not found', 404));
        const meta = { ...(creator.meta || {}) };
        meta.verification = {
            ...(meta.verification || {}),
            status: 'pending',
            requestedAt: new Date().toISOString(),
            documentsProvided: Array.isArray(req.body.documentsProvided) ? req.body.documentsProvided : [],
        };
        await creator.update({ meta });
        return sendSuccess(req, res, toVerification(creator));
    } catch (err) { return next(err); }
};

// POST /creators/:userId/verification/decide — admin: approve/reject
const decideVerification = async (req, res, next) => {
    try {
        if (!isAdmin(req)) return next(new AppError('FORBIDDEN', 'Admin access required', 403));
        const creator = await db.CreatorProfile.findOne({ where: { user_id: parseInt(req.params.userId) } });
        if (!creator) return next(new AppError('NOT_FOUND', 'Creator profile not found', 404));
        const decision = String(req.body.decision || '').toLowerCase();
        const meta = { ...(creator.meta || {}) };
        const v = { ...(meta.verification || {}) };
        if (decision === 'approve') {
            v.status = 'verified'; v.approvedAt = new Date().toISOString(); v.approverId = String(req.user.id);
            meta.verification = v;
            await creator.update({ is_verified: true, meta });
        } else if (decision === 'reject') {
            v.status = 'rejected'; v.rejectionReason = req.body.rejectionReason || 'Not approved';
            meta.verification = v;
            await creator.update({ is_verified: false, meta });
        } else {
            return next(new AppError('VALIDATION_ERROR', "decision must be 'approve' or 'reject'", 400));
        }
        return sendSuccess(req, res, toVerification(creator));
    } catch (err) { return next(err); }
};

module.exports = {
    listCreators, getCreator, updateCreator, getCreatorArticles,
    listPendingVerifications, getVerificationStatus, requestVerification, decideVerification,
};
