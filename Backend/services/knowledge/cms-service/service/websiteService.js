'use strict';
const { Op } = require('sequelize');
const { CmsWebsite, CmsWebsiteMember } = require('../models');
const { AppError } = require('../utils/errors');
const cache = require('./cacheService');
const config = require('../config/appConfig');
const { slugify } = require('../utils/slugify');
const { parsePagination, buildPaginated } = require('../utils/pagination');
const identityService = require('./identityService');
const invitationService = require('./invitationService');
const { emitSafe, CmsEvents } = require('../platform/events');
const { logger } = require('../platform/logger');
const db = require('../models');

/**
 * Resolve a caller "scope" into the org filter for a website query.
 *
 * Accepts either the new scope object `{ orgId, isPlatformAdmin }` threaded from the
 * controller, or a legacy plain `orgId` string (kept for any direct callers/scripts).
 * A platform principal (super_admin/owner/admin) is NOT org-scoped — they see and
 * manage every website across orgs, consistent with cmsAccess.loadCmsRole already
 * granting them cms_admin on any site. Everyone else is filtered to their org.
 */
function orgFilter(scope) {
    if (scope && typeof scope === 'object') {
        return scope.isPlatformAdmin ? {} : { organizationId: scope.orgId };
    }
    return { organizationId: scope };
}

/** Attach the platform user (name/email/avatar) to each membership row for display. */
async function enrichMembers(members) {
    const rows = members.map((m) => (typeof m.toJSON === 'function' ? m.toJSON() : m));
    const userMap = await identityService.mapByIds(rows.map((m) => m.userId));
    return rows.map((m) => {
        const u = userMap.get(String(m.userId));
        return {
            ...m,
            user: u
                ? { id: Number(u.id), fullName: u.fullName || u.email, email: u.email, avatarUrl: u.avatarUrl ?? null }
                : { id: Number(m.userId), fullName: `User #${m.userId}`, email: '', avatarUrl: null },
        };
    });
}

// Real per-website content/member counts for the websites list (replaces the prior
// always-0 placeholder — see getStats below for the single-website equivalent).
async function attachCounts(rows) {
    const websiteIds = rows.map((w) => w.id);
    if (websiteIds.length === 0) return rows.map((w) => ({ ...w.toJSON(), contentCount: 0, memberCount: 0 }));

    const [contentRows, memberRows] = await Promise.all([
        db.sequelize.query(
            'SELECT website_id AS "websiteId", COUNT(*)::int AS count FROM cms.cms_contents WHERE website_id IN (:ids) GROUP BY website_id',
            { replacements: { ids: websiteIds }, type: db.Sequelize.QueryTypes.SELECT },
        ),
        db.sequelize.query(
            'SELECT website_id AS "websiteId", COUNT(*)::int AS count FROM cms.cms_website_members WHERE website_id IN (:ids) GROUP BY website_id',
            { replacements: { ids: websiteIds }, type: db.Sequelize.QueryTypes.SELECT },
        ),
    ]);
    const contentCountMap = new Map(contentRows.map((r) => [r.websiteId, r.count]));
    const memberCountMap = new Map(memberRows.map((r) => [r.websiteId, r.count]));

    return rows.map((w) => ({
        ...w.toJSON(),
        contentCount: contentCountMap.get(w.id) ?? 0,
        memberCount: memberCountMap.get(w.id) ?? 0,
    }));
}

/**
 * Website ids the caller is a member of, or null when they should not be membership-scoped.
 *
 * A platform principal (super_admin/owner/admin) manages every site, so returns null.
 * Everyone else is limited to the sites they were explicitly granted — one person may hold
 * several, which is the normal case for a writer working across two or three publications.
 */
async function memberWebsiteIds(scope) {
    if (!scope || typeof scope !== 'object' || scope.isPlatformAdmin) return null;
    if (scope.userId == null) return []; // unknown principal → no sites, never all of them
    const rows = await CmsWebsiteMember.findAll({
        // An expired grant must not keep a site visible in the list either — otherwise the
        // console still advertises a site whose every request now 403s at loadCmsRole.
        where: {
            userId: scope.userId,
            [Op.or]: [{ expiresAt: null }, { expiresAt: { [Op.gt]: new Date() } }],
        },
        attributes: ['websiteId'],
        raw: true,
    });
    return rows.map((r) => r.websiteId);
}

async function listWebsites(scope, query = {}) {
    const { page, limit, offset } = parsePagination(query);
    const { status, search } = query;
    const where = {};
    if (status) where.status = status;
    if (search) where.name = { [Op.iLike]: `%${search}%` };

    // Scope the list to the caller's memberships. Detail routes were already gated by
    // loadCmsRole, but the list itself was only org-filtered — so a writer granted one site
    // could still read back the name and domain of every other site in the org.
    //
    // Membership REPLACES the org filter rather than narrowing it: a membership row is an
    // explicit, deliberate grant, and the sites someone is hired to work on frequently live
    // under a different organization than the one their own account was created in. ANDing
    // the two would silently hide exactly the sites they were just given.
    const allowedIds = await memberWebsiteIds(scope);
    if (allowedIds === null) {
        Object.assign(where, orgFilter(scope)); // platform principal → org rules apply
    } else {
        if (allowedIds.length === 0) {
            return buildPaginated([], 0, { page, limit });
        }
        where.id = { [Op.in]: allowedIds };
    }

    const { rows, count } = await CmsWebsite.findAndCountAll({
        where, limit, offset,
        order: [['createdAt', 'DESC']],
    });
    const enriched = await attachCounts(rows);
    return buildPaginated(enriched, count, { page, limit });
}

async function getWebsite(websiteId, scope) {
    const cacheKey = cache.keys.website(websiteId);
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const website = await CmsWebsite.findOne({ where: { id: websiteId, ...orgFilter(scope) } });
    if (!website) throw new AppError('NOT_FOUND', 'Website not found', 404);

    const data = website.toJSON();
    await cache.set(cacheKey, data, config.cache.taxonomyTtl);
    return data;
}

async function createWebsite(orgId, userId, body) {
    const { name, slug: rawSlug, domain, description, plan, modules, config: cfg, branding } = body;
    const slug = rawSlug || slugify(name);

    const existing = await CmsWebsite.findOne({ where: { slug } });
    if (existing) throw new AppError('CONFLICT', 'A website with this slug already exists', 409);

    const website = await CmsWebsite.create({
        organizationId: orgId, name, slug, domain, description, plan,
        modules, config: cfg, branding, createdBy: userId, status: 'active',
    });

    await CmsWebsiteMember.create({ websiteId: website.id, userId, role: 'cms_admin', invitedBy: null, joinedAt: new Date() });
    await cache.delPattern(`cms:websites:org:${orgId}*`);
    return website.toJSON();
}

async function updateWebsite(websiteId, scope, body) {
    const website = await CmsWebsite.findOne({ where: { id: websiteId, ...orgFilter(scope) } });
    if (!website) throw new AppError('NOT_FOUND', 'Website not found', 404);

    const statusChanged = 'status' in body && body.status !== website.status;
    const { slug } = website;

    await website.update(body);
    await cache.del(cache.keys.website(websiteId));
    await cache.delPattern(`cms:websites:org:${website.organizationId}*`);
    // A status flip (e.g. active -> inactive) must take effect immediately, not
    // wait out the public content TTL — otherwise a "disabled" site keeps serving
    // stale cached content/list/category responses for up to publicTtl seconds.
    if (statusChanged) {
        await cache.delPattern(`cms:public:${slug}:*`);
    }
    return website.toJSON();
}

async function deleteWebsite(websiteId, scope) {
    const website = await CmsWebsite.findOne({ where: { id: websiteId, ...orgFilter(scope) } });
    if (!website) throw new AppError('NOT_FOUND', 'Website not found', 404);

    const ownerOrgId = website.organizationId;
    await website.destroy();
    await cache.del(cache.keys.website(websiteId));
    await cache.delPattern(`cms:websites:org:${ownerOrgId}*`);
}

async function listMembers(websiteId, scope) {
    const website = await CmsWebsite.findOne({ where: { id: websiteId, ...orgFilter(scope) } });
    if (!website) throw new AppError('NOT_FOUND', 'Website not found', 404);

    const members = await CmsWebsiteMember.findAll({ where: { websiteId }, order: [['createdAt', 'DESC']] });
    return enrichMembers(members);
}

/**
 * Invite a user to a website with a CMS role.
 * Accepts either a resolved userId or an email. When an email resolves to an existing
 * platform user, they are granted the role immediately (they already have a login, so
 * there is nothing to email). When the email is unknown, this falls back to the
 * token-based contributor invite (invitationService) — it emails an accept link the
 * recipient uses to create their own account, rather than 404ing and telling the admin
 * to go create the account by hand first.
 *
 * Returns a `kind`-tagged result so the caller can tell which path was taken:
 * `{ kind: 'member', ... }` for an immediate grant, `{ kind: 'invitation', ... }` for
 * a pending invite (with `emailSent` reflecting whether the mail actually went out).
 */
/**
 * Grant one person access to SEVERAL websites in a single action.
 *
 * The console previously only offered a per-website member form, so granting a writer three
 * publications meant visiting three separate pages. Each site still goes through addMember,
 * so invitations for unknown emails, membership rows and MEMBER_INVITED events all behave
 * exactly as they do for a single grant.
 *
 * Per-site failures are collected rather than thrown: granting five sites where the user is
 * already on one should still grant the other four, and say so.
 */
/**
 * Every website membership across every site, for the console's People view.
 *
 * The staff directory knows a person's department; the CMS knows their site access — and
 * nothing joined the two, so "who is in Finance AND what can they reach?" could not be
 * answered anywhere. This returns the access half so the console can join them.
 *
 * Platform administrators only (enforced in the controller): it deliberately spans all
 * websites, which is exactly what a per-site membership check would otherwise prevent.
 */
async function listAllGrants(scope, query = {}) {
    const where = {};
    if (query.userId != null) where.userId = query.userId;
    // Batched lookup for a page of people. Without this the console had to pull EVERY grant
    // on the platform to annotate 50 rows, which stops being viable the moment the directory
    // is larger than a single page.
    if (Array.isArray(query.userIds) && query.userIds.length > 0) {
        where.userId = { [Op.in]: query.userIds };
    }
    if (query.websiteId) where.websiteId = query.websiteId;

    const members = await CmsWebsiteMember.findAll({ where, order: [['createdAt', 'DESC']] });
    if (members.length === 0) return [];

    const websites = await CmsWebsite.findAll({
        where: { id: { [Op.in]: [...new Set(members.map((m) => m.websiteId))] } },
        attributes: ['id', 'name', 'slug', 'domain'],
    });
    const siteById = new Map(websites.map((w) => [w.id, w.toJSON()]));

    const enriched = await enrichMembers(members);
    return enriched.map((m) => ({
        ...m,
        website: siteById.get(m.websiteId) ?? { id: m.websiteId, name: 'Unknown site', slug: '', domain: '' },
    }));
}

/**
 * Remove one person's access to EVERY website in a single action.
 *
 * Offboarding is where access management actually fails: revoking site by site means the one
 * site someone forgets stays live indefinitely. This does the whole set, and — importantly —
 * writes a separate audit record per site, so the trail names exactly what was taken away
 * rather than a single opaque "revoked all".
 *
 * Platform administrators only (enforced in the controller), since it spans every website.
 */
async function revokeAllAccess(scope, userId, actorId = null) {
    const members = await CmsWebsiteMember.findAll({ where: { userId } });
    if (members.length === 0) return { revoked: [], failed: [] };

    const websites = await CmsWebsite.findAll({
        where: { id: { [Op.in]: [...new Set(members.map((m) => m.websiteId))] } },
        attributes: ['id', 'name', 'slug'],
    });
    const siteById = new Map(websites.map((w) => [w.id, w.toJSON()]));

    const revoked = [];
    const failed = [];

    for (const member of members) {
        const site = siteById.get(member.websiteId);
        const revokedRole = member.role;
        try {
            await member.destroy();
            // One record per site — post-destroy, so a failed delete never logs a revocation.
            logAccessChange('removed', {
                websiteId: member.websiteId, websiteSlug: site?.slug ?? null,
                targetUserId: userId, revokedRole, actorId, viaRevokeAll: true,
            });
            emitSafe(CmsEvents.MEMBER_REMOVED, {
                websiteId: member.websiteId, websiteSlug: site?.slug ?? null,
                targetUserId: userId, revokedRole, actorId, viaRevokeAll: true,
            }, { tenantId: site?.slug });
            revoked.push({ websiteId: member.websiteId, websiteName: site?.name ?? 'Unknown site', role: revokedRole });
        } catch (err) {
            // Report rather than abort: one stuck row must not leave the rest of the access in place.
            failed.push({ websiteId: member.websiteId, websiteName: site?.name ?? 'Unknown site', reason: err.message });
        }
    }

    return { revoked, failed };
}

async function grantAccess(scope, body, inviterId = null) {
    const { websiteIds, role } = body;
    const granted = [];
    const invited = [];
    const skipped = [];

    for (const websiteId of websiteIds) {
        try {
            const result = await addMember(
                websiteId,
                scope,
                { userId: body.userId, email: body.email, role, personalNote: body.personalNote, expiresAt: body.expiresAt },
                inviterId,
            );
            (result.kind === 'invitation' ? invited : granted).push({ websiteId, ...result });
        } catch (err) {
            skipped.push({
                websiteId,
                code: err.code || 'ERROR',
                reason: err.message || 'Could not grant access to this website',
            });
        }
    }

    return { granted, invited, skipped, role };
}

async function addMember(websiteId, scope, body, inviterId = null) {
    const website = await CmsWebsite.findOne({ where: { id: websiteId, ...orgFilter(scope) } });
    if (!website) throw new AppError('NOT_FOUND', 'Website not found', 404);

    let userId = body.userId;
    if (userId == null && body.email) {
        const user = await identityService.findByEmail(body.email);
        if (!user) {
            const invitation = await invitationService.createInvitation(website, body.email, body.role, {
                inviterId,
                personalNote: body.personalNote,
            });
            return { kind: 'invitation', ...invitation };
        }
        userId = Number(user.id);
    }
    if (userId == null) throw new AppError('VALIDATION', 'A userId or email is required', 422);

    const existing = await CmsWebsiteMember.findOne({ where: { websiteId, userId } });
    if (existing) throw new AppError('CONFLICT', 'This user is already a member of this website', 409);

    const member = await CmsWebsiteMember.create({
        websiteId,
        userId,
        role: body.role,
        invitedBy: inviterId,
        joinedAt: new Date(),
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    });
    const [enriched] = await enrichMembers([member]);

    // Grants already emitted to the bus; also written to the local access log so the
    // granted / changed / revoked trail is readable in one place.
    logAccessChange('granted', { websiteId, websiteSlug: website.slug, targetUserId: userId, grantedRole: body.role, expiresAt: body.expiresAt ?? null, actorId: inviterId ?? null });
    emitSafe(CmsEvents.MEMBER_INVITED, {
        websiteSlug: website.slug,
        websiteId,
        userId, // kept for existing consumers — this is the RECIPIENT, not the actor
        targetUserId: userId,
        actorId: inviterId ?? null,
        role: body.role,
        expiresAt: body.expiresAt ?? null,
        invitedBy: inviterId,
    }, { tenantId: website.slug });

    return { kind: 'member', ...enriched };
}

/**
 * Write an access change to the service log as well as the event bus.
 *
 * emitSafe is fire-and-forget and FAIL-OPEN by design — a bus outage silently drops the
 * event. That is acceptable for cache-busting events, but a revocation is exactly the record
 * you need when something has gone wrong, so it also lands in the service log where it
 * survives independently of the bus.
 */
function logAccessChange(action, details) {
    try {
        // platform/logger exports a FACTORY — logger('scope').info(...) — not a logger object.
        logger('access-audit').info({ action, ...details }, `cms access ${action}`);
    } catch { /* logging must never throw into business logic */ }
}

async function updateMemberRole(websiteId, scope, userId, role) {
    const website = await CmsWebsite.findOne({ where: { id: websiteId, ...orgFilter(scope) } });
    if (!website) throw new AppError('NOT_FOUND', 'Website not found', 404);

    const member = await CmsWebsiteMember.findOne({ where: { websiteId, userId } });
    if (!member) throw new AppError('NOT_FOUND', 'Member not found', 404);

    // Captured BEFORE the update — once member.update() runs the old value is gone, and
    // "changed from X to Y" is the only form of this record worth having.
    const previousRole = member.role;

    await member.update({ role });

    // No-op guard: re-saving the same role should not manufacture an audit entry.
    if (previousRole !== role) {
        // scope.userId is the ACTOR (who made the change); `userId` is the TARGET.
        logAccessChange('role_changed', { websiteId, websiteSlug: website.slug, targetUserId: userId, previousRole, newRole: role, actorId: scope.userId ?? null });
        emitSafe(CmsEvents.MEMBER_ROLE_CHANGED, {
            websiteId,
            websiteSlug: website.slug,
            targetUserId: userId,
            previousRole,
            newRole: role,
            actorId: scope.userId ?? null,
        }, { tenantId: website.slug });
    }

    const [enriched] = await enrichMembers([member]);
    return enriched;
}

async function removeMember(websiteId, scope, userId) {
    const website = await CmsWebsite.findOne({ where: { id: websiteId, ...orgFilter(scope) } });
    if (!website) throw new AppError('NOT_FOUND', 'Website not found', 404);

    const member = await CmsWebsiteMember.findOne({ where: { websiteId, userId } });
    if (!member) throw new AppError('NOT_FOUND', 'Member not found', 404);

    // Read the role off the row before destroying it — afterwards there is nothing left to
    // say WHAT access was revoked, which is the part an investigation actually needs.
    const revokedRole = member.role;

    await member.destroy();

    // Emitted post-destroy so a failed delete never produces a revocation record.
    logAccessChange('removed', { websiteId, websiteSlug: website.slug, targetUserId: userId, revokedRole, actorId: scope.userId ?? null });
    emitSafe(CmsEvents.MEMBER_REMOVED, {
        websiteId,
        websiteSlug: website.slug,
        targetUserId: userId,
        revokedRole,
        actorId: scope.userId ?? null,
    }, { tenantId: website.slug });
}

/** Typeahead for the invite dialog: find platform users to add to this website. */
async function searchUsers(websiteId, scope, q) {
    const website = await CmsWebsite.findOne({ where: { id: websiteId, ...orgFilter(scope) } });
    if (!website) throw new AppError('NOT_FOUND', 'Website not found', 404);

    const users = await identityService.search(q);
    const existing = await CmsWebsiteMember.findAll({ where: { websiteId }, attributes: ['userId'] });
    const memberIds = new Set(existing.map((m) => String(m.userId)));
    return users.map((u) => ({
        id: Number(u.id),
        fullName: u.fullName || u.email,
        email: u.email,
        avatarUrl: u.avatarUrl ?? null,
        isMember: memberIds.has(String(u.id)),
    }));
}

// Real per-website content/media counts for the dashboard (replaces the prior 404).
async function getStats(websiteId) {
    const C = db.CmsContent;
    const [totalContent, publishedContent, draftContent, scheduledContent, pendingReview] = await Promise.all([
        C.count({ where: { websiteId } }),
        C.count({ where: { websiteId, status: 'published' } }),
        C.count({ where: { websiteId, status: 'draft' } }),
        C.count({ where: { websiteId, status: 'scheduled' } }),
        C.count({ where: { websiteId, status: ['pending_review', 'compliance_review'] } }),
    ]);
    let totalMedia = 0;
    try {
        const rows = await db.sequelize.query(
            'SELECT COUNT(DISTINCT mr.media_id)::int AS n FROM cms.cms_media_references mr JOIN cms.cms_contents c ON c.id = mr.content_id WHERE c.website_id = :wid',
            { replacements: { wid: websiteId }, type: db.Sequelize.QueryTypes.SELECT },
        );
        totalMedia = rows[0]?.n ?? 0;
    } catch { /* media references optional */ }
    return { totalContent, publishedContent, draftContent, scheduledContent, pendingReview, totalMedia, mediaStorageUsedMb: 0 };
}

module.exports = {
    grantAccess, listAllGrants, revokeAllAccess, listWebsites, getWebsite, createWebsite, updateWebsite, deleteWebsite, listMembers, addMember, updateMemberRole, removeMember, searchUsers, getStats };
