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

// Inlined (not imported from cmsAccess) to avoid the cmsAccess ↔ resolveWebsite
// circular require — cmsAccess requires this module for resolveWebsiteIdParam.
const PLATFORM_BYPASS_ROLES = ['super_admin', 'owner', 'admin'];

const isPlatformAdmin = (req) => {
    const roles = Array.isArray(req.auth?.roles)
        ? req.auth.roles
        : (req.auth?.role != null ? [req.auth.role] : []);
    return roles.some((r) => PLATFORM_BYPASS_ROLES.includes(r));
};

const slugCacheKey = (orgId, slug) => `cms:slug:${orgId}:${slug}`;

/**
 * Rewrite req.params.websiteId from a slug to the canonical UUID, in place.
 * No-op when the param is absent or already a UUID. Throws 404 for an unknown
 * slug. Safe to call from any handler that shares the route's param layer.
 *
 * Platform principals (super_admin/owner/admin) manage sites across ALL orgs, so
 * they resolve a slug WITHOUT the org filter — slugs are globally unique
 * (createWebsite enforces this), so this is unambiguous. The previous
 * unconditional `organizationId: orgId` filter 404'd platform admins on any site
 * outside their token's org (and silently skipped resolution when their token had
 * no org), which broke every slug-addressed page — e.g.
 * /cms/websites/imperialpedia/content — even though websiteService/loadCmsRole
 * already grant them access. Non-platform callers stay strictly org-scoped.
 */
async function resolveWebsiteIdParam(req) {
    const raw = req.params.websiteId;
    if (!raw || UUID_RE.test(raw)) return;

    const orgId = req.user?.orgId ?? req.auth?.orgId;
    const platformAdmin = isPlatformAdmin(req);

    // A non-platform caller with no org can't be safely scoped — let the
    // auth/membership gate reject it (unchanged behaviour for that case).
    if (!orgId && !platformAdmin) return;

    const where = platformAdmin ? { slug: raw } : { slug: raw, organizationId: orgId };
    const cacheKey = slugCacheKey(platformAdmin ? 'platform' : orgId, raw);

    let id = await cache.get(cacheKey);
    if (!id) {
        const website = await CmsWebsite.findOne({ where, attributes: ['id'] });
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
