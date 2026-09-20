'use strict';
const crypto = require('crypto');
const { Op } = require('sequelize');
const db = require('../models');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { MAX_FOLLOWS, MAX_SAVED, isEntityType, isSlug } = require('../utils/memberValidation');

// Every handler scopes by the token's user; nothing takes a user id from the request.
const uid = (req) => {
    if (req.user?.id == null) throw new AppError('UNAUTHORIZED', 'Account not provisioned', 401);
    return String(req.user.id);
};

const listFollows = async (req, res, next) => {
    try {
        const rows = await db.MemberFollow.findAll({
            where: { user_id: uid(req) },
            order: [['created_at', 'DESC']],
            attributes: ['entity_type', 'entity_slug', 'created_at'],
        });
        return sendSuccess(req, res, rows);
    } catch (err) { return next(err); }
};

const follow = async (req, res, next) => {
    try {
        const user_id = uid(req);
        const { entityType, slug } = req.body || {};
        if (!isEntityType(entityType) || !isSlug(slug)) throw new AppError('VALIDATION_ERROR', 'Invalid entity', 400);
        const existing = await db.MemberFollow.count({ where: { user_id } });
        const [, created] = await db.MemberFollow.findOrCreate({
            where: { user_id, entity_type: entityType, entity_slug: slug },
            defaults: { user_id, entity_type: entityType, entity_slug: slug },
        });
        if (created && existing >= MAX_FOLLOWS) {
            await db.MemberFollow.destroy({ where: { user_id, entity_type: entityType, entity_slug: slug } });
            throw new AppError('LIMIT_REACHED', `You can follow up to ${MAX_FOLLOWS} items`, 409);
        }
        return sendSuccess(req, res, { following: true }, created ? 201 : 200);
    } catch (err) { return next(err); }
};

const unfollow = async (req, res, next) => {
    try {
        const { entityType, slug } = req.params;
        if (!isEntityType(entityType) || !isSlug(slug)) throw new AppError('VALIDATION_ERROR', 'Invalid entity', 400);
        await db.MemberFollow.destroy({ where: { user_id: uid(req), entity_type: entityType, entity_slug: slug } });
        return sendSuccess(req, res, { following: false });
    } catch (err) { return next(err); }
};

const listSaved = async (req, res, next) => {
    try {
        const rows = await db.MemberSavedArticle.findAll({
            where: { user_id: uid(req) },
            order: [['created_at', 'DESC']],
            attributes: ['article_slug', 'created_at'],
        });
        return sendSuccess(req, res, rows);
    } catch (err) { return next(err); }
};

const saveArticle = async (req, res, next) => {
    try {
        const user_id = uid(req);
        const { slug } = req.body || {};
        if (!isSlug(slug)) throw new AppError('VALIDATION_ERROR', 'Invalid article', 400);
        const existing = await db.MemberSavedArticle.count({ where: { user_id } });
        const [, created] = await db.MemberSavedArticle.findOrCreate({
            where: { user_id, article_slug: slug },
            defaults: { user_id, article_slug: slug },
        });
        if (created && existing >= MAX_SAVED) {
            await db.MemberSavedArticle.destroy({ where: { user_id, article_slug: slug } });
            throw new AppError('LIMIT_REACHED', `You can save up to ${MAX_SAVED} articles`, 409);
        }
        return sendSuccess(req, res, { saved: true }, created ? 201 : 200);
    } catch (err) { return next(err); }
};

const unsaveArticle = async (req, res, next) => {
    try {
        if (!isSlug(req.params.slug)) throw new AppError('VALIDATION_ERROR', 'Invalid article', 400);
        await db.MemberSavedArticle.destroy({ where: { user_id: uid(req), article_slug: req.params.slug } });
        return sendSuccess(req, res, { saved: false });
    } catch (err) { return next(err); }
};

// Privacy: a member can wipe everything this layer knows about them in one call.
const deleteMyData = async (req, res, next) => {
    try {
        const user_id = uid(req);
        const [follows, saved] = await Promise.all([
            db.MemberFollow.destroy({ where: { user_id } }),
            db.MemberSavedArticle.destroy({ where: { user_id } }),
        ]);
        return sendSuccess(req, res, { follows, saved });
    } catch (err) { return next(err); }
};

const keysMatch = (a, b) => {
    const x = Buffer.from(String(a || ''));
    const y = Buffer.from(String(b || ''));
    return x.length === y.length && crypto.timingSafeEqual(x, y);
};

const MAX_NOTIFY_ENTITIES = 50;
const MAX_NOTIFY_FOLLOWERS = 5000;

/**
 * Service-to-service (the frontend's publish webhook): tell followers of the
 * entities a new article names. Fails closed when no key is configured. The
 * partial unique index on notifications makes repeats a no-op.
 */
const notifyFollowers = async (req, res, next) => {
    try {
        const expected = process.env.LAW_INTERNAL_KEY;
        if (!expected || !keysMatch(req.headers['x-service-key'], expected)) {
            throw new AppError('UNAUTHORIZED', 'Invalid service key', 401);
        }
        const { articleSlug, title, url, entities } = req.body || {};
        if (!isSlug(articleSlug) || typeof title !== 'string' || !title.trim() || typeof url !== 'string' || !url.startsWith('/') || url.startsWith('//')) {
            throw new AppError('VALIDATION_ERROR', 'Invalid article', 400);
        }
        const refs = (Array.isArray(entities) ? entities : [])
            .filter((e) => isEntityType(e?.entityType) && isSlug(e?.slug))
            .slice(0, MAX_NOTIFY_ENTITIES);
        if (refs.length === 0) return sendSuccess(req, res, { attempted: 0 });

        const followers = await db.MemberFollow.findAll({
            where: { [Op.or]: refs.map((e) => ({ entity_type: e.entityType, entity_slug: e.slug })) },
            attributes: ['user_id', 'entity_type', 'entity_slug'],
            limit: MAX_NOTIFY_FOLLOWERS,
        });
        // One notification per member, naming the first entity they follow.
        const byUser = new Map();
        followers.forEach((f) => { if (!byUser.has(f.user_id)) byUser.set(f.user_id, f); });

        const rows = [...byUser.values()].map((f) => ({
            user_id: f.user_id,
            type: 'follow_update',
            title: title.trim().slice(0, 500),
            message: `New story about ${f.entity_slug.replace(/-/g, ' ')}, which you follow.`,
            data: { articleSlug, url, entityType: f.entity_type, entitySlug: f.entity_slug },
        }));
        await db.Notification.bulkCreate(rows, { ignoreDuplicates: true });
        return sendSuccess(req, res, { attempted: rows.length });
    } catch (err) { return next(err); }
};

module.exports = { listFollows, follow, unfollow, listSaved, saveArticle, unsaveArticle, deleteMyData, notifyFollowers };
