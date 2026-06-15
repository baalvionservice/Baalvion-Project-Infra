'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');
const { generateToken, hashToken } = require('../utils/crypto');
const { sendMail } = require('../utils/mailer');
const config = require('../config/appConfig');
const auditService = require('./auditService');
const eventBus = require('../utils/eventBus');
const { orgRepo, userRepo, inviteRepo } = require('../repositories');
const { isValidRole, canManageOrganization, canManageUsers } = require('../utils/orgConstants');

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Legacy 'super_admin' grants are honoured for backward compat with pre-existing seed rows.
function memberCanManageUsers(role) {
    return role === 'super_admin' || canManageUsers(role);
}
function memberCanManageOrg(role) {
    return role === 'super_admin' || canManageOrganization(role);
}

// ── Org membership listing ──────────────────────────────────────────────────────

async function listOrgs(userId) {
    const memberships = await db.TeamMember.findAll({
        where: { user_id: userId, status: 'active' },
        include: [{ model: db.Organization, as: 'organization' }],
    });
    return memberships.map(m => ({
        id: m.organization.id,
        name: m.organization.name,
        slug: m.organization.slug,
        type: m.organization.type,
        status: m.organization.status,
        plan: m.organization.plan,
        role: m.role,
        serviceRoles: m.service_roles,
    }));
}

// Self-service org creation (any authenticated user becomes owner of a new buyer workspace).
async function createOrg({ userId, name, ipAddress }) {
    const org = await orgRepo.create({ name, ownerId: userId, type: 'buyer' });
    await db.TeamMember.create({ org_id: org.id, user_id: userId, role: 'owner', joined_at: new Date(), status: 'active' });
    await auditService.log({ userId, orgId: org.id, action: 'org.create', ipAddress });
    return { id: org.id, name: org.name, slug: org.slug, type: org.type, plan: org.plan };
}

async function getOrg(orgId, requesterId) {
    await assertMember(orgId, requesterId);
    return presentOrg(await orgRepo.findById(orgId));
}

async function updateOrgProfile({ orgId, fields, requesterId, ipAddress }) {
    await assertManageOrg(orgId, requesterId);
    const org = await orgRepo.updateProfile(orgId, fields);
    await auditService.log({ userId: requesterId, orgId, action: 'org.update', metadata: { fields: Object.keys(fields) }, ipAddress });
    return presentOrg(org);
}

async function getMembers(orgId, requesterId, { includeInactive = false } = {}) {
    await assertMember(orgId, requesterId);
    const members = await orgRepo.listMembers(orgId, { includeInactive });
    return members.map(presentMember);
}

// ── Invitations ───────────────────────────────────────────────────────────────

// HTML-escape any dynamic value before it is interpolated into an email body, so an org name,
// email, or branded base URL containing markup can't inject into the message.
function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Low-level invite issuance — NO authorization gate. Callers (org admins via inviteMember,
 * or the platform console seeding a new org's first owner) are responsible for authz.
 * Generates a single-use token, persists the invitation, sends the email, audits + emits.
 */
async function issueInvitation({ orgId, email, role, fullName = null, invitedBy, ipAddress, frontendUrl }) {
    if (!isValidRole(role)) throw new AppError('VALIDATION_ERROR', `Invalid role '${role}'`, 400);

    const token = generateToken();
    const token_hash = hashToken(token);
    const expires_at = new Date(Date.now() + INVITE_TTL_MS);

    await inviteRepo.destroyPending(orgId, email);
    const invitation = await inviteRepo.create({ orgId, email, role, tokenHash: token_hash, expiresAt: expires_at, createdBy: invitedBy, fullName });

    const org = await orgRepo.findById(orgId);
    // Per-site branding: callers (e.g. the CTM bulk-invite script) may override the accept-link
    // base so invites point at the right product domain; default to the platform frontend. ONLY
    // http(s) is accepted — never a javascript:/data: scheme in the email href.
    const rawBase = frontendUrl || config.frontendUrl || 'http://localhost:8080';
    const baseUrl = /^https?:\/\//i.test(rawBase) ? rawBase.replace(/\/$/, '') : (config.frontendUrl || 'http://localhost:8080');
    const inviteLink = `${baseUrl}/accept-invite?inviteToken=${token}&email=${encodeURIComponent(email)}`;
    // Every dynamic value is HTML-escaped before going into the email body (token is hex-safe).
    const orgName = escapeHtml(org?.name);
    const roleText = escapeHtml(role);
    const inviteHref = escapeHtml(inviteLink);
    const baseHref = escapeHtml(baseUrl);

    sendMail({
        to: email,
        subject: `You're invited to join ${org?.name || 'Baalvion'} on Baalvion`,
        html: `
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
              <h2 style="color:#1a1a2e">You're invited!</h2>
              <p>You've been invited to join <strong>${orgName}</strong> as <strong>${roleText}</strong>.</p>
              <p style="margin:24px 0">
                <a href="${inviteHref}" style="background:#6c63ff;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
                  Accept Invitation
                </a>
              </p>
              <p style="color:#666;font-size:13px">This invitation expires in 7 days. If you didn't expect this, you can safely ignore it.</p>
              <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
              <p style="color:#999;font-size:12px">Baalvion · <a href="${baseHref}" style="color:#999">${baseHref}</a></p>
            </div>
        `,
    }).catch(() => {});

    await auditService.log({ userId: invitedBy, orgId, action: 'member.invite', resourceType: 'invitation', resourceId: invitation.id, metadata: { email, role }, ipAddress });

    eventBus.publish('auth.invitation_created', {
        invitationId: invitation.id,
        orgId,
        orgName: org?.name || '',
        email,
        role,
        inviteLink,
        expiresAt: expires_at.toISOString(),
        invitedBy,
    }).catch(() => {});

    return { id: invitation.id, email, role, fullName, expiresAt: expires_at, inviteLink };
}

async function inviteMember({ orgId, email, role = 'viewer', fullName, requesterId, ipAddress }) {
    await assertManageUsers(orgId, requesterId);
    const result = await issueInvitation({ orgId, email, role, fullName, invitedBy: requesterId, ipAddress });
    return { id: result.id, email: result.email, role: result.role, expiresAt: result.expiresAt };
}

async function bulkInvite({ orgId, invites, requesterId, ipAddress, frontendUrl }) {
    await assertManageUsers(orgId, requesterId);
    const results = { invited: [], failed: [] };
    for (const inv of invites) {
        try {
            const r = await issueInvitation({ orgId, email: inv.email, role: inv.role || 'viewer', fullName: inv.fullName, invitedBy: requesterId, ipAddress, frontendUrl });
            results.invited.push({ email: r.email, role: r.role, id: r.id });
        } catch (err) {
            results.failed.push({ email: inv.email, reason: err.message || 'failed' });
        }
    }
    await auditService.log({ userId: requesterId, orgId, action: 'member.bulk_invite', metadata: { invited: results.invited.length, failed: results.failed.length }, ipAddress });
    return results;
}

async function listInvitations({ orgId, requesterId }) {
    await assertManageUsers(orgId, requesterId);
    const rows = await inviteRepo.listPending(orgId);
    return rows.map(i => ({
        id: i.id,
        email: i.email,
        role: i.role,
        fullName: i.full_name,
        expiresAt: i.expires_at,
        createdAt: i.created_at,
        expired: new Date() > i.expires_at,
    }));
}

async function resendInvitation({ orgId, invitationId, requesterId, ipAddress }) {
    await assertManageUsers(orgId, requesterId);
    const invitation = await inviteRepo.findById(invitationId);
    if (!invitation || String(invitation.org_id) !== String(orgId)) throw new AppError('NOT_FOUND', 'Invitation not found', 404);
    if (invitation.accepted_at) throw new AppError('INVALID_REQUEST', 'Invitation already accepted', 400);

    const token = generateToken();
    const expires_at = new Date(Date.now() + INVITE_TTL_MS);
    await inviteRepo.refreshToken(invitationId, hashToken(token), expires_at);

    const org = await orgRepo.findById(orgId);
    const frontendUrl = config.frontendUrl || 'http://localhost:8080';
    const inviteLink = `${frontendUrl}/accept-invite?inviteToken=${token}&email=${encodeURIComponent(invitation.email)}`;
    sendMail({
        to: invitation.email,
        subject: `Reminder: you're invited to join ${org?.name} on Baalvion`,
        html: `<p>You've been invited to join <strong>${org?.name}</strong> as <strong>${invitation.role}</strong>. <a href="${inviteLink}">Accept Invitation</a>. Expires in 7 days.</p>`,
    }).catch(() => {});

    await auditService.log({ userId: requesterId, orgId, action: 'member.invite_resent', resourceType: 'invitation', resourceId: invitationId, metadata: { email: invitation.email }, ipAddress });
    return { id: invitationId, email: invitation.email, role: invitation.role, expiresAt: expires_at };
}

async function revokeInvitation({ orgId, invitationId, requesterId, ipAddress }) {
    await assertManageUsers(orgId, requesterId);
    const invitation = await inviteRepo.findById(invitationId);
    if (!invitation || String(invitation.org_id) !== String(orgId)) throw new AppError('NOT_FOUND', 'Invitation not found', 404);
    await inviteRepo.revoke(invitationId);
    await auditService.log({ userId: requesterId, orgId, action: 'member.invite_revoked', resourceType: 'invitation', resourceId: invitationId, metadata: { email: invitation.email }, ipAddress });
}

// User-initiated accept (already-logged-in user joining via token in URL).
async function acceptInvitation({ token, userId, ipAddress }) {
    const token_hash = hashToken(token);
    const invitation = await db.Invitation.findOne({ where: { token_hash, accepted_at: null, revoked_at: null } });
    if (!invitation) throw new AppError('INVALID_TOKEN', 'Invalid or expired invitation', 400);
    if (new Date() > invitation.expires_at) throw new AppError('TOKEN_EXPIRED', 'Invitation has expired', 400);

    const user = await db.User.findByPk(userId);
    if (!user) throw new AppError('NOT_FOUND', 'User not found', 404);
    if (user.email !== invitation.email) throw new AppError('FORBIDDEN', 'Invitation is for a different email', 403);

    await orgRepo.addMember({ orgId: invitation.org_id, userId, role: invitation.role, invitedBy: invitation.created_by });
    await invitation.update({ accepted_at: new Date() });
    await auditService.log({ userId, orgId: invitation.org_id, action: 'member.join', ipAddress });
    return { orgId: invitation.org_id, role: invitation.role };
}

// ── Member lifecycle ────────────────────────────────────────────────────────────

async function removeMember({ orgId, targetUserId, requesterId, ipAddress }) {
    await assertManageUsers(orgId, requesterId);
    if (String(targetUserId) === String(requesterId)) throw new AppError('INVALID_REQUEST', 'Cannot remove yourself', 400);
    const member = await orgRepo.getMember(orgId, targetUserId);
    if (!member) throw new AppError('NOT_FOUND', 'Member not found', 404);
    if (member.role === 'owner') throw new AppError('FORBIDDEN', 'Cannot remove the org owner', 403);

    await orgRepo.removeMember(orgId, targetUserId);
    await auditService.log({ userId: requesterId, orgId, action: 'member.remove', metadata: { targetUserId }, ipAddress });
}

async function suspendMember({ orgId, targetUserId, requesterId, ipAddress }) {
    await assertManageUsers(orgId, requesterId);
    if (String(targetUserId) === String(requesterId)) throw new AppError('INVALID_REQUEST', 'Cannot suspend yourself', 400);
    const member = await orgRepo.getMember(orgId, targetUserId);
    if (!member) throw new AppError('NOT_FOUND', 'Member not found', 404);
    if (member.role === 'owner') throw new AppError('FORBIDDEN', 'Cannot suspend the org owner', 403);

    await orgRepo.suspendMember(orgId, targetUserId, requesterId);
    await auditService.log({ userId: requesterId, orgId, action: 'member.suspend', metadata: { targetUserId }, ipAddress });
}

async function reactivateMember({ orgId, targetUserId, requesterId, ipAddress }) {
    await assertManageUsers(orgId, requesterId);
    const member = await orgRepo.getMember(orgId, targetUserId);
    if (!member) throw new AppError('NOT_FOUND', 'Member not found', 404);
    await orgRepo.reactivateMember(orgId, targetUserId);
    await auditService.log({ userId: requesterId, orgId, action: 'member.reactivate', metadata: { targetUserId }, ipAddress });
}

async function updateMemberRole({ orgId, targetUserId, role, serviceRoles, requesterId, ipAddress }) {
    await assertManageUsers(orgId, requesterId);
    if (role !== undefined && !isValidRole(role)) throw new AppError('VALIDATION_ERROR', `Invalid role '${role}'`, 400);
    const member = await orgRepo.getActiveMember(orgId, targetUserId);
    if (!member) throw new AppError('NOT_FOUND', 'Member not found', 404);
    if (member.role === 'owner') throw new AppError('FORBIDDEN', 'Cannot change owner role — transfer ownership instead', 403);

    await member.update({ role: role ?? member.role, service_roles: serviceRoles ?? member.service_roles });
    await auditService.log({ userId: requesterId, orgId, action: 'member.role_update', metadata: { targetUserId, role }, ipAddress });
    return { role: member.role, serviceRoles: member.service_roles };
}

async function transferOwnership({ orgId, newOwnerUserId, requesterId, ipAddress }) {
    await assertManageOrg(orgId, requesterId);  // only the current owner may transfer
    const newOwner = await orgRepo.getActiveMember(orgId, newOwnerUserId);
    if (!newOwner) throw new AppError('NOT_FOUND', 'Target user is not an active member', 404);
    if (String(newOwnerUserId) === String(requesterId)) throw new AppError('INVALID_REQUEST', 'You are already the owner', 400);

    // Promote new owner, demote the current owner to admin, repoint org.owner_id.
    await newOwner.update({ role: 'owner' });
    const current = await orgRepo.getActiveMember(orgId, requesterId);
    if (current) await current.update({ role: 'admin' });
    await orgRepo.setOwner(orgId, newOwnerUserId);
    await auditService.log({ userId: requesterId, orgId, action: 'org.ownership_transfer', metadata: { newOwnerUserId }, ipAddress });
    return { ownerId: String(newOwnerUserId) };
}

async function forcePasswordReset({ orgId, targetUserId, requesterId, ipAddress }) {
    await assertManageUsers(orgId, requesterId);
    const member = await orgRepo.getMember(orgId, targetUserId);
    if (!member) throw new AppError('NOT_FOUND', 'Member not found', 404);
    const user = await userRepo.findById(targetUserId);
    if (!user) throw new AppError('NOT_FOUND', 'User not found', 404);

    // Lazy require to avoid any load-order coupling with authService.
    const authService = require('./authService');
    await authService.forgotPassword({ email: user.email, ipAddress });
    await auditService.log({ userId: requesterId, orgId, action: 'member.force_password_reset', metadata: { targetUserId }, ipAddress });
    return { email: user.email };
}

async function forceMfa({ orgId, targetUserId, required = true, requesterId, ipAddress }) {
    await assertManageUsers(orgId, requesterId);
    const member = await orgRepo.getMember(orgId, targetUserId);
    if (!member) throw new AppError('NOT_FOUND', 'Member not found', 404);
    await userRepo.setMfaRequired(targetUserId, required);
    await auditService.log({ userId: requesterId, orgId, action: 'member.force_mfa', metadata: { targetUserId, required: !!required }, ipAddress });
    return { mfaRequired: !!required };
}

// ── Audit ─────────────────────────────────────────────────────────────────────

async function getAuditLogs({ orgId, userId, page = 1, limit = 50 }) {
    const offset = (page - 1) * limit;
    const where = {};
    if (orgId) where.org_id = orgId;
    if (userId) where.user_id = userId;
    const { count, rows } = await db.AuditLog.findAndCountAll({ where, order: [['created_at', 'DESC']], limit, offset });
    return { total: count, page, limit, logs: rows };
}

// ── Presenters ──────────────────────────────────────────────────────────────────

function presentOrg(org) {
    if (!org) return null;
    return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        type: org.type,
        status: org.status,
        plan: org.plan,
        legalName: org.legal_name,
        displayName: org.display_name,
        country: org.country,
        jurisdiction: org.jurisdiction,
        contactEmail: org.contact_email,
        contactPhone: org.contact_phone,
        ownerId: org.owner_id != null ? String(org.owner_id) : null,
        createdAt: org.created_at,
    };
}

function presentMember(m) {
    return {
        id: m.id,
        userId: String(m.user_id),
        email: m.user?.email,
        fullName: m.user?.full_name,
        avatarUrl: m.user?.avatar_url,
        role: m.role,
        serviceRoles: m.service_roles,
        status: m.status,
        userStatus: m.user?.status,
        mfaEnabled: m.user?.mfa_enabled,
        mfaRequired: m.user?.mfa_required,
        lastLoginAt: m.user?.last_login_at,
        joinedAt: m.joined_at,
    };
}

// ── Authorization helpers ─────────────────────────────────────────────────────

async function assertMember(orgId, userId) {
    const m = await orgRepo.getActiveMember(orgId, userId);
    if (!m) throw new AppError('FORBIDDEN', 'Not a member of this organization', 403);
    return m;
}

async function assertManageUsers(orgId, userId) {
    const m = await assertMember(orgId, userId);
    if (!memberCanManageUsers(m.role)) throw new AppError('FORBIDDEN', 'User-management permission required', 403);
    return m;
}

async function assertManageOrg(orgId, userId) {
    const m = await assertMember(orgId, userId);
    if (!memberCanManageOrg(m.role)) throw new AppError('FORBIDDEN', 'Organization-owner permission required', 403);
    return m;
}

module.exports = {
    listOrgs, createOrg, getOrg, updateOrgProfile, getMembers,
    issueInvitation, inviteMember, bulkInvite, listInvitations, resendInvitation, revokeInvitation, acceptInvitation,
    removeMember, suspendMember, reactivateMember, updateMemberRole, transferOwnership,
    forcePasswordReset, forceMfa, getAuditLogs,
    // exported for reuse/testing
    presentOrg, presentMember,
};
