'use strict';
const { CmsAccessRequest, CmsWebsite, CmsWebsiteMember, Op } = require('../models');
const { AppError } = require('../utils/errors');
const websiteService = require('./websiteService');
const identityService = require('./identityService');

const PUBLIC_WEBSITE_ATTRS = ['id', 'slug', 'name'];

// Names of the sites the caller is NOT on, so they can pick one to ask for. Name and slug only —
// no domain or content — and only live sites. Platform admins already see everything.
async function listRequestableWebsites(userId) {
    const memberships = await CmsWebsiteMember.findAll({ where: { userId }, attributes: ['websiteId'] });
    const mine = memberships.map((m) => m.websiteId);
    const where = { status: 'active' };
    if (mine.length) where.id = { [Op.notIn]: mine };
    return CmsWebsite.findAll({ where, attributes: PUBLIC_WEBSITE_ATTRS, order: [['name', 'ASC']] });
}

async function createRequest(user, { websiteId, role, note }) {
    const website = await CmsWebsite.findOne({ where: { id: websiteId, status: 'active' }, attributes: PUBLIC_WEBSITE_ATTRS });
    if (!website) throw new AppError('NOT_FOUND', 'Website not found', 404);

    if (await CmsWebsiteMember.findOne({ where: { websiteId, userId: user.id } })) {
        throw new AppError('CONFLICT', 'You already have access to this website', 409);
    }
    if (await CmsAccessRequest.findOne({ where: { websiteId, userId: user.id, status: 'pending' } })) {
        throw new AppError('CONFLICT', 'You already have a pending request for this website', 409);
    }

    const profile = (await identityService.mapByIds([user.id]))?.get(String(user.id)) ?? null;
    const row = await CmsAccessRequest.create({
        websiteId,
        userId: user.id,
        requesterEmail: profile?.email ?? user.email ?? null,
        requesterName: profile?.fullName ?? null,
        requestedRole: role,
        note: note || null,
        status: 'pending',
    });
    return { ...row.toJSON(), website: website.toJSON() };
}

async function listMine(userId) {
    const rows = await CmsAccessRequest.findAll({
        where: { userId },
        include: [{ model: CmsWebsite, as: 'website', attributes: PUBLIC_WEBSITE_ATTRS }],
        order: [['createdAt', 'DESC']],
        limit: 100,
    });
    return rows.map((r) => r.toJSON());
}

async function listForAdmin({ status = 'pending' } = {}) {
    const where = status === 'all' ? {} : { status };
    const rows = await CmsAccessRequest.findAll({
        where,
        include: [{ model: CmsWebsite, as: 'website', attributes: PUBLIC_WEBSITE_ATTRS }],
        order: [['createdAt', status === 'pending' ? 'ASC' : 'DESC']],
        limit: 200,
    });
    return rows.map((r) => r.toJSON());
}

async function loadPending(id) {
    const row = await CmsAccessRequest.findOne({ where: { id } });
    if (!row) throw new AppError('NOT_FOUND', 'Request not found', 404);
    if (row.status !== 'pending') throw new AppError('CONFLICT', `This request was already ${row.status}`, 409);
    return row;
}

// Approving creates the ordinary membership through websiteService.addMember, so the audit log,
// bus event and role rules are exactly the same as a direct grant.
async function approve(id, scope, adminId, { role, decisionNote } = {}) {
    const row = await loadPending(id);
    const grantedRole = role || row.requestedRole;
    const alreadyMember = await CmsWebsiteMember.findOne({ where: { websiteId: row.websiteId, userId: row.userId } });
    if (!alreadyMember) {
        await websiteService.addMember(row.websiteId, scope, { userId: Number(row.userId), role: grantedRole }, adminId);
    }
    await row.update({ status: 'approved', requestedRole: grantedRole, decidedBy: adminId, decidedAt: new Date(), decisionNote: decisionNote || null });
    return row.toJSON();
}

async function deny(id, adminId, { decisionNote } = {}) {
    const row = await loadPending(id);
    await row.update({ status: 'denied', decidedBy: adminId, decidedAt: new Date(), decisionNote: decisionNote || null });
    return row.toJSON();
}

module.exports = { listRequestableWebsites, createRequest, listMine, listForAdmin, approve, deny };
