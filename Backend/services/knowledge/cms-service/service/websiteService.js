'use strict';
const { Op } = require('sequelize');
const { CmsWebsite, CmsWebsiteMember } = require('../models');
const { AppError } = require('../utils/errors');
const cache = require('./cacheService');
const config = require('../config/appConfig');
const { slugify } = require('../utils/slugify');
const { parsePagination, buildPaginated } = require('../utils/pagination');

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

    return CmsWebsiteMember.findAll({ where: { websiteId }, order: [['createdAt', 'DESC']] });
}

async function addMember(websiteId, orgId, body) {
    const website = await CmsWebsite.findOne({ where: { id: websiteId, organizationId: orgId } });
    if (!website) throw new AppError('NOT_FOUND', 'Website not found', 404);

    const existing = await CmsWebsiteMember.findOne({ where: { websiteId, userId: body.userId } });
    if (existing) throw new AppError('CONFLICT', 'User is already a member of this website', 409);

    return CmsWebsiteMember.create({ websiteId, userId: body.userId, role: body.role, invitedBy: null, joinedAt: new Date() });
}

async function updateMemberRole(websiteId, orgId, userId, role) {
    const website = await CmsWebsite.findOne({ where: { id: websiteId, organizationId: orgId } });
    if (!website) throw new AppError('NOT_FOUND', 'Website not found', 404);

    const member = await CmsWebsiteMember.findOne({ where: { websiteId, userId } });
    if (!member) throw new AppError('NOT_FOUND', 'Member not found', 404);

    await member.update({ role });
    return member.toJSON();
}

async function removeMember(websiteId, orgId, userId) {
    const website = await CmsWebsite.findOne({ where: { id: websiteId, organizationId: orgId } });
    if (!website) throw new AppError('NOT_FOUND', 'Website not found', 404);

    const member = await CmsWebsiteMember.findOne({ where: { websiteId, userId } });
    if (!member) throw new AppError('NOT_FOUND', 'Member not found', 404);

    await member.destroy();
}

module.exports = { listWebsites, getWebsite, createWebsite, updateWebsite, deleteWebsite, listMembers, addMember, updateMemberRole, removeMember };
