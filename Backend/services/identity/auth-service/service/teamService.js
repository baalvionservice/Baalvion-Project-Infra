const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const db = require('../models');
const { AppError } = require('../utils/errors');
const { generateToken, hashToken } = require('../utils/crypto');
const { sendMail } = require('../utils/mailer');
const config = require('../config/appConfig');
const auditService = require('./auditService');
const eventBus = require('../utils/eventBus');

async function listOrgs(userId) {
    const memberships = await db.TeamMember.findAll({
        where: { user_id: userId, status: 'active' },
        include: [{ model: db.Organization, as: 'organization' }],
    });
    return memberships.map(m => ({
        id: m.organization.id,
        name: m.organization.name,
        slug: m.organization.slug,
        plan: m.organization.plan,
        role: m.role,
        serviceRoles: m.service_roles,
    }));
}

async function createOrg({ userId, name, ipAddress }) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 60) + '-' + uuidv4().slice(0, 6);
    const org = await db.Organization.create({ name, slug, owner_id: userId });
    await db.TeamMember.create({ org_id: org.id, user_id: userId, role: 'owner', joined_at: new Date(), status: 'active' });
    await auditService.log({ userId, orgId: org.id, action: 'org.create', ipAddress });
    return { id: org.id, name: org.name, slug: org.slug, plan: org.plan };
}

async function getMembers(orgId, requesterId) {
    await assertMember(orgId, requesterId);
    const members = await db.TeamMember.findAll({
        where: { org_id: orgId, status: 'active' },
        include: [{ model: db.User, as: 'user', attributes: ['id', 'email', 'full_name', 'avatar_url'] }],
    });
    return members.map(m => ({
        id: m.id,
        userId: m.user_id,
        email: m.user?.email,
        fullName: m.user?.full_name,
        avatarUrl: m.user?.avatar_url,
        role: m.role,
        serviceRoles: m.service_roles,
        joinedAt: m.joined_at,
    }));
}

async function inviteMember({ orgId, email, role, requesterId, ipAddress }) {
    await assertAdmin(orgId, requesterId);

    const token = generateToken();
    const token_hash = hashToken(token);
    const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Remove any existing pending invitation for same email+org
    await db.Invitation.destroy({ where: { org_id: orgId, email, accepted_at: null } });
    const invitation = await db.Invitation.create({ org_id: orgId, email, role, token_hash, expires_at, created_by: requesterId });

    const org = await db.Organization.findByPk(orgId);
    const frontendUrl = config.frontendUrl || 'http://localhost:8080';
    const inviteLink = `${frontendUrl}/accept-invite?inviteToken=${token}&email=${encodeURIComponent(email)}`;
    await sendMail({
        to: email,
        subject: `You're invited to join ${org?.name} on Baalvion`,
        html: `
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
              <h2 style="color:#1a1a2e">You're invited!</h2>
              <p>You've been invited to join <strong>${org?.name}</strong> as <strong>${role}</strong>.</p>
              <p style="margin:24px 0">
                <a href="${inviteLink}" style="background:#6c63ff;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
                  Accept Invitation
                </a>
              </p>
              <p style="color:#666;font-size:13px">This invitation expires in 7 days. If you didn't expect this, you can safely ignore it.</p>
              <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
              <p style="color:#999;font-size:12px">Baalvion · <a href="${frontendUrl}" style="color:#999">${frontendUrl}</a></p>
            </div>
        `,
    });

    await auditService.log({ userId: requesterId, orgId, action: 'member.invite', metadata: { email, role }, ipAddress });

    // Publish for notification-service to send the invite email via its template engine
    eventBus.publish('auth.invitation_created', {
        invitationId: invitation.id,
        orgId,
        orgName:      org?.name || '',
        email,
        role,
        inviteLink,
        expiresAt:    expires_at.toISOString(),
        invitedBy:    requesterId,
    }).catch(() => {});

    return { id: invitation.id, email, role, expiresAt: expires_at };
}

async function acceptInvitation({ token, userId, ipAddress }) {
    const token_hash = hashToken(token);
    const invitation = await db.Invitation.findOne({ where: { token_hash, accepted_at: null } });
    if (!invitation) throw new AppError('INVALID_TOKEN', 'Invalid or expired invitation', 400);
    if (new Date() > invitation.expires_at) throw new AppError('TOKEN_EXPIRED', 'Invitation has expired', 400);

    const user = await db.User.findByPk(userId);
    if (!user) throw new AppError('NOT_FOUND', 'User not found', 404);
    if (user.email !== invitation.email) throw new AppError('FORBIDDEN', 'Invitation is for a different email', 403);

    const existing = await db.TeamMember.findOne({ where: { org_id: invitation.org_id, user_id: userId } });
    if (existing) {
        await existing.update({ status: 'active', role: invitation.role, joined_at: new Date() });
    } else {
        await db.TeamMember.create({ org_id: invitation.org_id, user_id: userId, role: invitation.role, invited_by: invitation.created_by, joined_at: new Date(), status: 'active' });
    }

    await invitation.update({ accepted_at: new Date() });
    await auditService.log({ userId, orgId: invitation.org_id, action: 'member.join', ipAddress });
    return { orgId: invitation.org_id, role: invitation.role };
}

async function removeMember({ orgId, targetUserId, requesterId, ipAddress }) {
    await assertAdmin(orgId, requesterId);
    if (String(targetUserId) === String(requesterId)) throw new AppError('INVALID_REQUEST', 'Cannot remove yourself', 400);

    const member = await db.TeamMember.findOne({ where: { org_id: orgId, user_id: targetUserId } });
    if (!member) throw new AppError('NOT_FOUND', 'Member not found', 404);
    if (member.role === 'owner') throw new AppError('FORBIDDEN', 'Cannot remove the org owner', 403);

    await member.update({ status: 'removed' });
    await auditService.log({ userId: requesterId, orgId, action: 'member.remove', metadata: { targetUserId }, ipAddress });
}

async function updateMemberRole({ orgId, targetUserId, role, serviceRoles, requesterId, ipAddress }) {
    await assertAdmin(orgId, requesterId);
    const member = await db.TeamMember.findOne({ where: { org_id: orgId, user_id: targetUserId, status: 'active' } });
    if (!member) throw new AppError('NOT_FOUND', 'Member not found', 404);
    if (member.role === 'owner') throw new AppError('FORBIDDEN', 'Cannot change owner role', 403);

    await member.update({ role: role ?? member.role, service_roles: serviceRoles ?? member.service_roles });
    await auditService.log({ userId: requesterId, orgId, action: 'member.role_update', metadata: { targetUserId, role }, ipAddress });
    return { role: member.role, serviceRoles: member.service_roles };
}

async function getAuditLogs({ orgId, userId, page = 1, limit = 50 }) {
    const offset = (page - 1) * limit;
    const where = {};
    if (orgId) where.org_id = orgId;
    if (userId) where.user_id = userId;

    const { count, rows } = await db.AuditLog.findAndCountAll({ where, order: [['created_at', 'DESC']], limit, offset });
    return { total: count, page, limit, logs: rows };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
async function assertMember(orgId, userId) {
    const m = await db.TeamMember.findOne({ where: { org_id: orgId, user_id: userId, status: 'active' } });
    if (!m) throw new AppError('FORBIDDEN', 'Not a member of this organization', 403);
    return m;
}

async function assertAdmin(orgId, userId) {
    const m = await assertMember(orgId, userId);
    if (!['owner', 'admin'].includes(m.role)) throw new AppError('FORBIDDEN', 'Admin access required', 403);
    return m;
}

module.exports = { listOrgs, createOrg, getMembers, inviteMember, acceptInvitation, removeMember, updateMemberRole, getAuditLogs };
