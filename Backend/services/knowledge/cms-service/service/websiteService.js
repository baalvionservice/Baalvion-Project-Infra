'use strict';
const { Op } = require('sequelize');
const { CmsWebsite, CmsWebsiteMember } = require('../models');
const { AppError } = require('../utils/errors');
const cache = require('./cacheService');
const config = require('../config/appConfig');
const { slugify } = require('../utils/slugify');
const { parsePagination, buildPaginated } = require('../utils/pagination');
const identityService = require('./identityService');
const { emitSafe, CmsEvents } = require('../platform/events');

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

async function listWebsites(orgId, query = {}) {
    const { page, limit, offset } = parsePagination(query);
    const { status, search } = query;
    const where = { organizationId: orgId };
    if (status) where.status = status;
    if (search) where.name = { [Op.iLike]: `%${search}%` };

    const { rows, count } = await CmsWebsite.findAndCountAll({
        where, limit, offset,
        order: [['createdAt', 'DESC']],
    });
    return buildPaginated(rows, count, { page, limit });
}

async function getWebsite(websiteId, orgId) {
    const cacheKey = cache.keys.website(websiteId);
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const website = await CmsWebsite.findOne({ where: { id: websiteId, organizationId: orgId } });
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

async function updateWebsite(websiteId, orgId, body) {
    const website = await CmsWebsite.findOne({ where: { id: websiteId, organizationId: orgId } });
    if (!website) throw new AppError('NOT_FOUND', 'Website not found', 404);

    await website.update(body);
    await cache.del(cache.keys.website(websiteId));
    await cache.delPattern(`cms:websites:org:${orgId}*`);
    return website.toJSON();
}

async function deleteWebsite(websiteId, orgId) {
    const website = await CmsWebsite.findOne({ where: { id: websiteId, organizationId: orgId } });
    if (!website) throw new AppError('NOT_FOUND', 'Website not found', 404);

    await website.destroy();
    await cache.del(cache.keys.website(websiteId));
    await cache.delPattern(`cms:websites:org:${orgId}*`);
}

async function listMembers(websiteId, orgId) {
    const website = await CmsWebsite.findOne({ where: { id: websiteId, organizationId: orgId } });
    if (!website) throw new AppError('NOT_FOUND', 'Website not found', 404);

    const members = await CmsWebsiteMember.findAll({ where: { websiteId }, order: [['createdAt', 'DESC']] });
    return enrichMembers(members);
}

/**
 * Invite a user to a website with a CMS role.
 * Accepts either a resolved userId or an email. When an email is given it is
 * resolved against the platform identity store; an unknown email is a 404 so the
 * console can tell the admin to create the user under Identity → Users first.
 */
async function addMember(websiteId, orgId, body, inviterId = null) {
    const website = await CmsWebsite.findOne({ where: { id: websiteId, organizationId: orgId } });
    if (!website) throw new AppError('NOT_FOUND', 'Website not found', 404);

    let userId = body.userId;
    if (userId == null && body.email) {
        const user = await identityService.findByEmail(body.email);
        if (!user) {
            throw new AppError(
                'NOT_FOUND',
                `No platform user found with email "${body.email}". Create the user under Identity → Users first, then invite them.`,
                404,
            );
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
    });
    const [enriched] = await enrichMembers([member]);

    emitSafe(CmsEvents.MEMBER_INVITED, {
        websiteSlug: website.slug,
        websiteId,
        userId,
        role: body.role,
        invitedBy: inviterId,
    }, { tenantId: website.slug });

    return enriched;
}

async function updateMemberRole(websiteId, orgId, userId, role) {
    const website = await CmsWebsite.findOne({ where: { id: websiteId, organizationId: orgId } });
    if (!website) throw new AppError('NOT_FOUND', 'Website not found', 404);

    const member = await CmsWebsiteMember.findOne({ where: { websiteId, userId } });
    if (!member) throw new AppError('NOT_FOUND', 'Member not found', 404);

    await member.update({ role });
    const [enriched] = await enrichMembers([member]);
    return enriched;
}

async function removeMember(websiteId, orgId, userId) {
    const website = await CmsWebsite.findOne({ where: { id: websiteId, organizationId: orgId } });
    if (!website) throw new AppError('NOT_FOUND', 'Website not found', 404);

    const member = await CmsWebsiteMember.findOne({ where: { websiteId, userId } });
    if (!member) throw new AppError('NOT_FOUND', 'Member not found', 404);

    await member.destroy();
}

/** Typeahead for the invite dialog: find platform users to add to this website. */
async function searchUsers(websiteId, orgId, q) {
    const website = await CmsWebsite.findOne({ where: { id: websiteId, organizationId: orgId } });
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
const db = require('../models');
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

module.exports = { listWebsites, getWebsite, createWebsite, updateWebsite, deleteWebsite, listMembers, addMember, updateMemberRole, removeMember, searchUsers, getStats };
