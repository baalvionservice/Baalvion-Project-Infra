'use strict';

/**
 * Slug-or-UUID website resolver.
 *
 * The admin console addresses websites by their human-readable slug
 * (e.g. /cms/websites/imperialpedia) instead of the opaque UUID. Every
 * website-scoped controller reads `req.params.websiteId` and treats it as the
 * canonical primary key, so this normalises that param to the real UUID.
 *
 * IMPORTANT (Express routing): in `router.use(path, a, b, c)` each handler is a
 * SEPARATE layer and Express re-extracts `req.params` from the URL per layer, so
 * mutating the param in a parent-mount middleware does NOT survive into a
 * mergeParams sub-router. Resolution must therefore happen inside the SAME route
 * layer as the controller — i.e. as a route-level handler (see loadCmsRole,
 * which is the first handler on every website-scoped route).
 */

const { CmsWebsite } = require('../models');
const { AppError } = require('../utils/errors');
const cache = require('./../service/cacheService');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG_CACHE_TTL = 300; // seconds — slugs are immutable after creation

const slugCacheKey = (orgId, slug) => `cms:slug:${orgId}:${slug}`;

/**
 * Rewrite req.params.websiteId from a slug to the canonical UUID, in place.
 * No-op when the param is absent or already a UUID. Throws 404 for an unknown
 * slug. Safe to call from any handler that shares the route's param layer.
 */
async function resolveWebsiteIdParam(req) {
    const raw = req.params.websiteId;
    if (!raw || UUID_RE.test(raw)) return;

    const orgId = req.user?.orgId ?? req.auth?.orgId;
    if (!orgId) return; // unauthenticated — let the auth gate reject it

    const cacheKey = slugCacheKey(orgId, raw);
    let id = await cache.get(cacheKey);
    if (!id) {
        const website = await CmsWebsite.findOne({
            where: { slug: raw, organizationId: orgId },
            attributes: ['id'],
        });
        if (!website) throw new AppError('NOT_FOUND', 'Website not found', 404);
        id = website.id;
        await cache.set(cacheKey, id, SLUG_CACHE_TTL);
    }
    req.params.websiteId = id;
}

/** Standalone middleware for routes that do NOT run loadCmsRole (e.g. delete). */
const resolveWebsiteParam = async (req, res, next) => {
    try {
        await resolveWebsiteIdParam(req);
        return next();
    } catch (err) {
        return next(err);
    }
};

module.exports = { resolveWebsiteParam, resolveWebsiteIdParam };
