'use strict';
const crypto = require('crypto');
const db = require('../models');
const nodebb = require('./nodebbClient');
const moderation = require('./moderationService');
const { AppError } = require('../utils/errors');

// Best-effort NodeBB sync: community-service's own `community_memberships` row is always the
// authoritative access decision; the NodeBB group grant/revoke is a downstream side effect.
// If NodeBB is unreachable this does not fail the membership write — it logs and moves on
// (no retry queue in this MVP pass; a future pass could enqueue a retry job instead).
async function syncNodeBBAccess(community, userId, email, grant) {
    try {
        const uid = await nodebb.resolveUidByEmail(email);
        if (!uid) return;
        const groups = [community.nodebb_group_member, community.nodebb_group_paid, community.nodebb_group_mod].filter(Boolean);
        for (const groupSlug of groups) {
            if (grant && groupSlug === community.nodebb_group_member) await nodebb.addUserToGroup(uid, groupSlug);
            else await nodebb.removeUserFromGroup(uid, groupSlug);
        }
    } catch {
        // Non-fatal — see header comment.
    }
}

async function listCommunities() {
    return db.Community.findAll({ where: { is_active: true }, order: [['name', 'ASC']] });
}

async function getCommunityBySlug(slug, userId) {
    const community = await db.Community.findOne({ where: { slug, is_active: true } });
    if (!community) throw new AppError('NOT_FOUND', 'Community not found', 404);
    let membership = null;
    if (userId) {
        membership = await db.CommunityMembership.findOne({ where: { community_id: community.id, user_id: userId } });
    }
    return { community, membership };
}

async function upsertMembership(communityId, userId, fields) {
    const [row] = await db.CommunityMembership.findOrCreate({
        where: { community_id: communityId, user_id: userId },
        defaults: { community_id: communityId, user_id: userId, ...fields },
    });
    await row.update(fields);
    return row;
}

// Dispatches on the community's access_model. free → immediate approval; request_approval →
// a pending join request (membership row tracks 'requested' so UI can reflect it); invite_only
// and paid are rejected here (must go through redeemInvite / checkout respectively).
async function join(slug, userId, email, message) {
    const community = await db.Community.findOne({ where: { slug, is_active: true } });
    if (!community) throw new AppError('NOT_FOUND', 'Community not found', 404);

    const existing = await db.CommunityMembership.findOne({ where: { community_id: community.id, user_id: userId } });
    if (existing && ['approved', 'paid'].includes(existing.status)) {
        throw new AppError('ALREADY_MEMBER', 'Already a member of this community', 409);
    }
    if (existing && existing.status === 'banned') {
        throw new AppError('FORBIDDEN', 'You are banned from this community', 403);
    }

    if (community.access_model === 'free') {
        const membership = await upsertMembership(community.id, userId, { role: 'member', status: 'approved', started_at: new Date() });
        await syncNodeBBAccess(community, userId, email, true);
        await moderation.log({ communityId: community.id, actorUserId: userId, action: 'member.joined', targetUserId: userId });
        return { community, membership };
    }

    if (community.access_model === 'request_approval') {
        await db.CommunityJoinRequest.create({ community_id: community.id, user_id: userId, message: message || null, status: 'pending' });
        const membership = await upsertMembership(community.id, userId, { role: 'member', status: 'requested' });
        await moderation.log({ communityId: community.id, actorUserId: userId, action: 'join_request.created', targetUserId: userId });
        return { community, membership };
    }

    if (community.access_model === 'invite_only') {
        throw new AppError('INVITE_REQUIRED', 'This community is invite-only — you need an invite link', 403);
    }

    // paid — billing deferred to a later pass (see plan MVP scope)
    throw new AppError('NOT_IMPLEMENTED', 'Paid community checkout is not available yet', 501);
}

async function createInvite(community, invitedByUserId, invitedEmail) {
    const token = crypto.randomBytes(24).toString('hex');
    const invite = await db.CommunityInvite.create({
        community_id: community.id,
        invited_by_user_id: invitedByUserId,
        invited_email: invitedEmail || null,
        token,
        status: 'pending',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    await moderation.log({ communityId: community.id, actorUserId: invitedByUserId, action: 'invite.created', details: { inviteId: invite.id, invitedEmail: invitedEmail || null } });
    return invite;
}

async function redeemInvite(token, userId, email) {
    const invite = await db.CommunityInvite.findOne({ where: { token } });
    if (!invite || invite.status !== 'pending') throw new AppError('INVALID_INVITE', 'Invite is invalid or already used', 400);
    if (invite.expires_at && invite.expires_at < new Date()) {
        await invite.update({ status: 'expired' });
        throw new AppError('INVALID_INVITE', 'Invite has expired', 400);
    }
    const community = await db.Community.findByPk(invite.community_id);
    if (!community) throw new AppError('NOT_FOUND', 'Community not found', 404);

    const membership = await upsertMembership(community.id, userId, { role: 'member', status: 'approved', started_at: new Date() });
    await invite.update({ status: 'redeemed' });
    await syncNodeBBAccess(community, userId, email, true);
    await moderation.log({ communityId: community.id, actorUserId: userId, action: 'invite.redeemed', targetUserId: userId, details: { inviteId: invite.id } });
    return { community, membership };
}

async function listJoinRequests(community, status = 'pending') {
    return db.CommunityJoinRequest.findAll({ where: { community_id: community.id, status }, order: [['created_at', 'ASC']] });
}

// Cross-community view for the admin console — every pending request across every
// community, with the community's own name/slug attached (a plain moderator only sees
// their own community's queue via listJoinRequests; this is the platform-admin overview).
async function listAllPendingJoinRequests() {
    return db.CommunityJoinRequest.findAll({
        where: { status: 'pending' },
        include: [{ model: db.Community, as: 'community', attributes: ['slug', 'name'] }],
        order: [['created_at', 'ASC']],
    });
}

async function decideJoinRequest(community, requestId, reviewerId, approve, userEmailResolver) {
    const request = await db.CommunityJoinRequest.findOne({ where: { id: requestId, community_id: community.id } });
    if (!request || request.status !== 'pending') throw new AppError('NOT_FOUND', 'Join request not found or already decided', 404);

    await request.update({ status: approve ? 'approved' : 'rejected', reviewed_by_user_id: reviewerId, reviewed_at: new Date() });

    if (approve) {
        const membership = await upsertMembership(community.id, request.user_id, { role: 'member', status: 'approved', started_at: new Date() });
        const email = typeof userEmailResolver === 'function' ? await userEmailResolver(request.user_id) : null;
        await syncNodeBBAccess(community, request.user_id, email, true);
        await moderation.log({ communityId: community.id, actorUserId: reviewerId, action: 'join_request.approved', targetUserId: request.user_id, details: { requestId } });
    } else {
        await upsertMembership(community.id, request.user_id, { status: 'rejected' });
        await moderation.log({ communityId: community.id, actorUserId: reviewerId, action: 'join_request.rejected', targetUserId: request.user_id, details: { requestId } });
    }
    return request;
}

async function adminSetMember(community, targetUserId, targetEmail, { role, status }, actorUserId) {
    const membership = await upsertMembership(community.id, targetUserId, {
        ...(role ? { role } : {}),
        ...(status ? { status } : {}),
        ...(status === 'approved' ? { started_at: new Date() } : {}),
    });
    const grant = ['approved', 'paid'].includes(membership.status);
    await syncNodeBBAccess(community, targetUserId, targetEmail, grant);
    await moderation.log({ communityId: community.id, actorUserId, action: grant ? 'member.granted' : 'member.revoked', targetUserId, details: { role, status } });
    return membership;
}

async function moderationLogs(community) {
    return db.CommunityModerationLog.findAll({ where: { community_id: community.id }, order: [['created_at', 'DESC']], limit: 200 });
}

async function allModerationLogs() {
    return db.CommunityModerationLog.findAll({
        include: [{ model: db.Community, as: 'community', attributes: ['slug', 'name'] }],
        order: [['created_at', 'DESC']],
        limit: 200,
    });
}

module.exports = {
    listCommunities,
    getCommunityBySlug,
    join,
    createInvite,
    redeemInvite,
    listJoinRequests,
    listAllPendingJoinRequests,
    decideJoinRequest,
    adminSetMember,
    moderationLogs,
    allModerationLogs,
};
