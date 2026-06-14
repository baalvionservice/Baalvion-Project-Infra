'use strict';
/**
 * Platform-owner organization administration.
 *
 * Every operation here is gated on PLATFORM AUTHORITY: the caller must be an active
 * owner/admin of an org whose type is `platform_owner`. This is what lets a non-technical
 * platform owner onboard unlimited organizations of any trade-network type and inspect
 * their users / audit trail — with NO developer involvement.
 */
const db = require('../models');
const redis = require('../config/redis');
const { AppError } = require('../utils/errors');
const auditService = require('./auditService');
const teamService = require('./teamService');
const { orgRepo, userRepo, sessionRepo, rtRepo } = require('../repositories');
const { isValidOrgType } = require('../utils/orgConstants');

/** Throws FORBIDDEN unless the user is a platform authority. Returns the platform membership. */
async function assertPlatformAuthority(userId) {
    const membership = await orgRepo.findPlatformAuthority(userId);
    if (!membership) throw new AppError('FORBIDDEN', 'Platform-owner authority required', 403);
    return membership;
}

async function createOrganization({ requesterId, data, ipAddress }) {
    await assertPlatformAuthority(requesterId);
    if (!isValidOrgType(data.type)) throw new AppError('VALIDATION_ERROR', `Invalid organization type '${data.type}'`, 400);

    const org = await orgRepo.createWithProfile({
        name: data.name,
        slug: data.slug,
        type: data.type,
        legalName: data.legalName,
        displayName: data.displayName,
        country: data.country,
        jurisdiction: data.jurisdiction,
        contactEmail: data.contactEmail || null,
        contactPhone: data.contactPhone,
        status: data.status || 'active',
        ownerId: null,
    });

    await auditService.log({ userId: requesterId, orgId: org.id, action: 'org.platform_create', resourceType: 'organization', resourceId: org.id, metadata: { type: org.type, name: org.name }, ipAddress });

    // Optionally seed the org's first owner by inviting them immediately.
    let ownerInvite = null;
    if (data.ownerEmail) {
        ownerInvite = await teamService.issueInvitation({
            orgId: org.id, email: data.ownerEmail, role: 'owner',
            fullName: data.ownerFullName, invitedBy: requesterId, ipAddress,
        });
    }

    return { org: teamService.presentOrg(org), ownerInvite: ownerInvite ? { id: ownerInvite.id, email: ownerInvite.email, expiresAt: ownerInvite.expiresAt } : null };
}

async function listOrganizations({ requesterId, search, type, status, page = 1, limit = 25 }) {
    await assertPlatformAuthority(requesterId);
    const { total, rows } = await orgRepo.listPaginated({ search, type, status, page, limit });
    const items = await Promise.all(rows.map(async (org) => ({
        ...teamService.presentOrg(org),
        memberCount: await orgRepo.countActiveMembers(org.id),
    })));
    return { total, page, limit, items };
}

async function getOrganization({ requesterId, orgId }) {
    await assertPlatformAuthority(requesterId);
    const org = await orgRepo.findById(orgId);
    if (!org) throw new AppError('NOT_FOUND', 'Organization not found', 404);
    const [memberCount, owner] = await Promise.all([
        orgRepo.countActiveMembers(orgId),
        org.owner_id ? userRepo.findById(org.owner_id) : null,
    ]);
    return {
        ...teamService.presentOrg(org),
        memberCount,
        owner: owner ? { id: String(owner.id), email: owner.email, fullName: owner.full_name } : null,
    };
}

async function updateOrganization({ requesterId, orgId, fields, ipAddress }) {
    await assertPlatformAuthority(requesterId);
    const org = await orgRepo.findById(orgId);
    if (!org) throw new AppError('NOT_FOUND', 'Organization not found', 404);
    const updated = await orgRepo.updateProfile(orgId, fields);
    await auditService.log({ userId: requesterId, orgId, action: 'org.platform_update', resourceType: 'organization', resourceId: orgId, metadata: { fields: Object.keys(fields) }, ipAddress });
    return teamService.presentOrg(updated);
}

async function setOrganizationStatus({ requesterId, orgId, status, ipAddress }) {
    await assertPlatformAuthority(requesterId);
    const org = await orgRepo.findById(orgId);
    if (!org) throw new AppError('NOT_FOUND', 'Organization not found', 404);
    if (org.type === 'platform_owner') throw new AppError('FORBIDDEN', 'The platform organization cannot be suspended', 403);

    const updated = await orgRepo.setStatus(orgId, status);

    let auditMetadata;
    if (status === 'suspended') {
        // Authoritative DB-side revocation FIRST: kill every active session for the org and the
        // refresh tokens bound to them. Errors here propagate — never half-suspend silently.
        const ids = await sessionRepo.revokeByOrg(orgId);
        await rtRepo.revokeBySessionIds(ids);
        // Redis kill-switch SECOND: rejects in-flight access tokens before their natural expiry.
        // Wrapped so a Redis outage cannot undo the authoritative DB revocation above.
        try {
            await redis.setOrgSuspended(orgId);
        } catch (err) {
            console.error('[platformService] setOrgSuspended failed (DB revocation already applied):', err.message);
        }
        auditMetadata = { sessionsRevoked: ids.length };
    } else if (status === 'active') {
        try {
            await redis.clearOrgSuspended(orgId);
        } catch (err) {
            console.error('[platformService] clearOrgSuspended failed:', err.message);
        }
    }

    await auditService.log({ userId: requesterId, orgId, action: status === 'suspended' ? 'org.suspend' : 'org.reactivate', resourceType: 'organization', resourceId: orgId, metadata: auditMetadata, ipAddress });
    return teamService.presentOrg(updated);
}

async function listOrganizationUsers({ requesterId, orgId }) {
    await assertPlatformAuthority(requesterId);
    const members = await orgRepo.listMembers(orgId, { includeInactive: true });
    return members.map(teamService.presentMember);
}

async function getOrganizationAudit({ requesterId, orgId, page = 1, limit = 50 }) {
    await assertPlatformAuthority(requesterId);
    return teamService.getAuditLogs({ orgId, page, limit });
}

async function getMetrics({ requesterId }) {
    await assertPlatformAuthority(requesterId);
    const [orgCounts, userCount, pendingInvites] = await Promise.all([
        orgRepo.aggregateCounts(),
        db.User.count(),
        db.Invitation.count({ where: { accepted_at: null, revoked_at: null } }),
    ]);
    return {
        organizations: {
            total: orgCounts.total,
            byType: orgCounts.byType.reduce((acc, r) => { acc[r.type] = Number(r.count); return acc; }, {}),
            byStatus: orgCounts.byStatus.reduce((acc, r) => { acc[r.status] = Number(r.count); return acc; }, {}),
        },
        users: { total: userCount },
        invitations: { pending: pendingInvites },
    };
}

module.exports = {
    assertPlatformAuthority,
    createOrganization,
    listOrganizations,
    getOrganization,
    updateOrganization,
    setOrganizationStatus,
    listOrganizationUsers,
    getOrganizationAudit,
    getMetrics,
};
