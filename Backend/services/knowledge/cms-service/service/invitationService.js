'use strict';
const crypto = require('crypto');
const { sequelize, CmsInvitation, CmsWebsiteMember, CmsAuthor, CmsWebsite } = require('../models');
const { AppError } = require('../utils/errors');
const identityService = require('./identityService');
const mailer = require('./mailer');
const { slugify } = require('../utils/slugify');
const { emitSafe, CmsEvents } = require('../platform/events');

const TOKEN_BYTES = 32;
const EXPIRES_HOURS = 72;

const ROLE_LABELS = {
    cms_admin: 'Admin',
    cms_editor: 'Editor',
    cms_publisher: 'Publisher',
    cms_reviewer: 'Reviewer',
    cms_compliance: 'Compliance',
    cms_seo_manager: 'SEO Manager',
    cms_author: 'Writer',
    cms_contributor: 'Contributor',
    cms_viewer: 'Viewer',
};
const roleLabelOf = (role) => ROLE_LABELS[role] || role;

const hashToken = (raw) => crypto.createHash('sha256').update(raw).digest('hex');

const toSummary = (invitation) => ({
    id: invitation.id,
    email: invitation.email,
    role: invitation.role,
    roleLabel: roleLabelOf(invitation.role),
    status: invitation.status,
    inviterName: invitation.inviterName || undefined,
    personalNote: invitation.personalNote || undefined,
    expiresAt: invitation.expiresAt,
    acceptedAt: invitation.acceptedAt || undefined,
    createdAt: invitation.createdAt,
});

/**
 * Invite someone who does NOT yet have a platform account to write for a website —
 * the VIP "you're invited to write for {publication}" flow. Account creation itself
 * happens later, entirely inside auth-service, when the recipient accepts; this only
 * reserves the seat, emails the branded invite, and stores the token hash (never the
 * raw token — that only ever exists in the outbound email and the recipient's URL).
 *
 * The supersede-then-create is wrapped in a transaction with a row lock on any existing
 * pending invite for this email+website, so two concurrent invite requests for the same
 * person can never both leave a "live" token outstanding.
 */
async function createInvitation(website, email, role, { inviterId, personalNote } = {}) {
    const normalizedEmail = email.trim().toLowerCase();
    const rawToken = crypto.randomBytes(TOKEN_BYTES).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + EXPIRES_HOURS * 60 * 60 * 1000);

    let inviterName = null;
    if (inviterId != null) {
        const map = await identityService.mapByIds([inviterId]);
        const inviter = map.get(String(inviterId));
        inviterName = inviter ? (inviter.fullName || inviter.email) : null;
    }

    const invitation = await sequelize.transaction(async (t) => {
        const priorPending = await CmsInvitation.findAll({
            where: { websiteId: website.id, email: normalizedEmail, status: 'pending' },
            transaction: t,
            lock: t.LOCK.UPDATE,
        });
        await Promise.all(priorPending.map((p) => p.update({ status: 'revoked' }, { transaction: t })));

        return CmsInvitation.create({
            websiteId: website.id,
            email: normalizedEmail,
            role,
            inviterId: inviterId ?? null,
            inviterName,
            personalNote: personalNote || null,
            tokenHash,
            status: 'pending',
            expiresAt,
        }, { transaction: t });
    });

    const mailResult = await mailer.sendContributorInvitation({
        to: normalizedEmail,
        publication: website.name,
        roleName: roleLabelOf(role),
        inviterName,
        personalNote: personalNote || undefined,
        token: rawToken,
        expiresHours: EXPIRES_HOURS,
    });

    emitSafe(CmsEvents.CONTRIBUTOR_INVITED, {
        websiteSlug: website.slug,
        websiteId: website.id,
        email: normalizedEmail,
        role,
        invitedBy: inviterId ?? null,
    }, { tenantId: website.slug });

    return { ...toSummary(invitation), emailSent: !!mailResult.sent };
}

/** Public, token-authenticated view — safe to render before the recipient has a session. */
async function getPublicInvitation(rawToken) {
    if (!rawToken) throw new AppError('NOT_FOUND', 'Invitation not found', 404);
    const tokenHash = hashToken(rawToken);
    const invitation = await CmsInvitation.findOne({ where: { tokenHash } });
    if (!invitation) throw new AppError('NOT_FOUND', 'Invitation not found', 404);

    const website = await CmsWebsite.findByPk(invitation.websiteId);
    if (!website) throw new AppError('NOT_FOUND', 'Invitation not found', 404);

    // Lazily flip an overdue pending invite to expired so the status read is honest.
    let status = invitation.status;
    if (status === 'pending' && new Date() > invitation.expiresAt) {
        status = 'expired';
        await invitation.update({ status });
    }

    const existingUser = await identityService.findByEmail(invitation.email);

    return {
        publicationName: website.name,
        websiteId: website.id,
        role: invitation.role,
        roleLabel: roleLabelOf(invitation.role),
        email: invitation.email,
        inviterName: invitation.inviterName || undefined,
        personalNote: invitation.personalNote || undefined,
        expiresAt: invitation.expiresAt,
        status,
        hasAccount: !!existingUser,
    };
}

/** Best-effort unique author slug within a website: name, then name-2, name-3, ... */
async function uniqueAuthorSlug(websiteId, name, transaction) {
    const base = slugify(name) || 'contributor';
    let candidate = base;
    let suffix = 2;
    // Bounded retries — a website will not plausibly have 50 authors sharing one name.
    for (let i = 0; i < 50; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const clash = await CmsAuthor.findOne({ where: { websiteId, slug: candidate }, transaction });
        if (!clash) return candidate;
        candidate = `${base}-${suffix}`;
        suffix += 1;
    }
    return `${base}-${Date.now()}`;
}

/**
 * Finalise a contributor invitation. Requires the caller to already be authenticated
 * (auth-service issued their session via /register or /login just before this call) —
 * their verified platform email must match the invitation's reserved email, which is
 * the actual proof of ownership here (mirrors auth-service's own accept-invite trust
 * model: possession of a valid, single-use, time-boxed token plus a matching account).
 *
 * The whole grant (membership upsert + author profile + invitation status flip) runs in
 * one transaction with a row lock on the invitation, so a double-submit (e.g. a repeated
 * click) can never create two membership rows or two author profiles for one accept.
 */
async function acceptInvitation(rawToken, userId, authorProfile) {
    if (!rawToken) throw new AppError('NOT_FOUND', 'Invitation not found', 404);
    const tokenHash = hashToken(rawToken);

    const caller = (await identityService.mapByIds([userId])).get(String(userId));
    if (!caller) throw new AppError('FORBIDDEN', 'Could not resolve the authenticated account', 403);

    const result = await sequelize.transaction(async (t) => {
        const invitation = await CmsInvitation.findOne({ where: { tokenHash }, transaction: t, lock: t.LOCK.UPDATE });
        if (!invitation) throw new AppError('NOT_FOUND', 'Invitation not found', 404);
        if (invitation.status === 'accepted') throw new AppError('CONFLICT', 'This invitation has already been claimed', 409);
        if (invitation.status === 'revoked') throw new AppError('GONE', 'This invitation is no longer active', 410);
        if (new Date() > invitation.expiresAt) {
            if (invitation.status === 'pending') await invitation.update({ status: 'expired' }, { transaction: t });
            throw new AppError('GONE', 'This invitation has expired', 410);
        }
        if (caller.email.toLowerCase() !== invitation.email.toLowerCase()) {
            throw new AppError('FORBIDDEN', 'This invitation was issued to a different email address', 403);
        }

        const website = await CmsWebsite.findByPk(invitation.websiteId, { transaction: t });
        if (!website) throw new AppError('NOT_FOUND', 'Website not found', 404);

        const existingMember = await CmsWebsiteMember.findOne({
            where: { websiteId: website.id, userId }, transaction: t, lock: t.LOCK.UPDATE,
        });
        if (existingMember) {
            await existingMember.update({ role: invitation.role }, { transaction: t });
        } else {
            await CmsWebsiteMember.create({
                websiteId: website.id,
                userId,
                role: invitation.role,
                invitedBy: invitation.inviterId,
                joinedAt: new Date(),
            }, { transaction: t });
        }

        const name = authorProfile.name || caller.fullName || caller.email;
        const slug = await uniqueAuthorSlug(website.id, name, t);
        await CmsAuthor.create({
            websiteId: website.id,
            slug,
            name,
            title: authorProfile.title ?? null,
            credentials: authorProfile.credentials ?? null,
            bio: authorProfile.bio ?? null,
            avatarUrl: authorProfile.avatarUrl ?? null,
            expertise: authorProfile.expertise || [],
            social: authorProfile.social || {},
            seoMetadata: {},
            sortOrder: 0,
            status: 'active',
            contentCount: 0,
        }, { transaction: t });

        await invitation.update({ status: 'accepted', acceptedBy: userId, acceptedAt: new Date() }, { transaction: t });

        return { websiteId: website.id, websiteSlug: website.slug, role: invitation.role };
    });

    emitSafe(CmsEvents.INVITATION_ACCEPTED, {
        websiteSlug: result.websiteSlug,
        websiteId: result.websiteId,
        userId,
        role: result.role,
    }, { tenantId: result.websiteSlug });

    return { websiteId: result.websiteId, redirectTo: '/welcome' };
}

/** Admin-facing list — every invitation ever sent for a website, newest first. */
async function listInvitations(websiteId) {
    const invitations = await CmsInvitation.findAll({
        where: { websiteId },
        order: [['createdAt', 'DESC']],
    });
    const now = new Date();
    return invitations.map((inv) => {
        const status = inv.status === 'pending' && now > inv.expiresAt ? 'expired' : inv.status;
        return toSummary({ ...inv.toJSON(), status });
    });
}

/** Revoke a still-pending invitation so its link stops working. */
async function revokeInvitation(websiteId, invitationId) {
    const invitation = await CmsInvitation.findOne({ where: { id: invitationId, websiteId } });
    if (!invitation) throw new AppError('NOT_FOUND', 'Invitation not found', 404);
    if (invitation.status !== 'pending') {
        throw new AppError('CONFLICT', `Cannot revoke an invitation that is already ${invitation.status}`, 409);
    }
    await invitation.update({ status: 'revoked' });
}

/**
 * Resend — mints a fresh token and email for an existing invitee, reusing their original
 * role/note. Works for pending OR expired invitations (a common "oops, it expired" case);
 * an already-accepted or already-revoked invitation must be re-sent via a brand-new invite.
 */
async function resendInvitation(website, invitationId, inviterId) {
    const invitation = await CmsInvitation.findOne({ where: { id: invitationId, websiteId: website.id } });
    if (!invitation) throw new AppError('NOT_FOUND', 'Invitation not found', 404);
    if (invitation.status === 'accepted') throw new AppError('CONFLICT', 'This invitation has already been claimed', 409);

    return createInvitation(website, invitation.email, invitation.role, {
        inviterId: inviterId ?? invitation.inviterId,
        personalNote: invitation.personalNote,
    });
}

module.exports = {
    createInvitation,
    getPublicInvitation,
    acceptInvitation,
    listInvitations,
    revokeInvitation,
    resendInvitation,
    roleLabelOf,
};
