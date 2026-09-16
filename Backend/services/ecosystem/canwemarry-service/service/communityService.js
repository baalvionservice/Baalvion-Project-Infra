'use strict';
const db = require('../models');
const notificationService = require('./notificationService');
const { cleanText, cleanBody } = require('../utils/sanitize');
const { notFound, forbidden, conflict, badRequest } = require('../utils/errors');

const MEMBER_STATUS = Object.freeze({ PENDING: 'PENDING', ACTIVE: 'ACTIVE', BANNED: 'BANNED', LEFT: 'LEFT' });
const JOIN_POLICY = Object.freeze({ OPEN: 'OPEN', REQUEST: 'REQUEST', INVITE: 'INVITE' });

/**
 * A PRIVATE community is not listed to non-members. Its existence, not just its content,
 * is what membership buys — a community for one town's families is itself sensitive.
 */
const COMMUNITY_SORTS = {
    name: [['name', 'ASC']],
    newest: [['created_at', 'DESC']],
    // Ordered by the real time of the last post, across the whole table rather than the page
    // in hand — sorting a page by a value computed for that page would put the rows in an
    // order that means nothing. A community nobody has posted in sorts last, not first.
    active: [[db.sequelize.literal(
        '(SELECT MAX(p.created_at) FROM canwemarry.posts p WHERE p.community_id = "Community"."id") DESC NULLS LAST',
    )]],
};

async function list(ctx, { page, pageSize, countryCode, visibility, q, sort }) {
    const filters = [{ is_active: true }];
    if (countryCode) filters.push({ country_code: countryCode.toUpperCase() });

    // The visibility FILTER narrows what is already permitted; it never widens it. The
    // membership clause below is applied regardless, so asking for PRIVATE returns only the
    // private communities the caller is already in.
    if (visibility) filters.push({ visibility });

    if (q) {
        // Escaped so a term of underscores or percent signs is matched literally rather than
        // becoming a wildcard that returns the whole table.
        const term = `%${q.replace(/[\\%_]/g, (ch) => `\\${ch}`)}%`;
        filters.push({
            [db.Op.or]: [
                { name: { [db.Op.iLike]: term } },
                { description: { [db.Op.iLike]: term } },
                { purpose: { [db.Op.iLike]: term } },
            ],
        });
    }

    const visible = [{ visibility: 'PUBLIC' }];
    if (ctx.communityIds.length) visible.push({ id: { [db.Op.in]: ctx.communityIds } });
    filters.push({ [db.Op.or]: visible });

    const { rows, count } = await db.Community.findAndCountAll({
        where: { [db.Op.and]: filters },
        order: COMMUNITY_SORTS[sort] || COMMUNITY_SORTS.name,
        limit: pageSize,
        offset: (page - 1) * pageSize,
    });

    const stats = await activityFor(rows.map((r) => r.id));
    return { items: rows.map((r) => serialize(r, ctx, stats[r.id])), total: count };
}

/**
 * Member and discussion counts for a page of communities.
 *
 * Two grouped queries rather than a subquery per row: the hub shows a couple of dozen
 * communities at a time and this keeps it to a fixed number of round trips. The numbers are
 * real counts, not estimates — a community hub that inflated its membership would be the
 * same kind of lie as a fabricated testimonial.
 */
async function activityFor(ids) {
    if (ids.length === 0) return {};

    const [members, posts] = await Promise.all([
        db.CommunityMember.findAll({
            where: { community_id: { [db.Op.in]: ids }, status: MEMBER_STATUS.ACTIVE },
            attributes: ['community_id', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']],
            group: ['community_id'],
            raw: true,
        }),
        db.Post.findAll({
            where: { community_id: { [db.Op.in]: ids }, moderation_state: 'VISIBLE' },
            attributes: [
                'community_id',
                [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count'],
                [db.sequelize.fn('MAX', db.sequelize.col('created_at')), 'last_at'],
            ],
            group: ['community_id'],
            raw: true,
        }),
    ]);

    const out = {};
    for (const id of ids) out[id] = { memberCount: 0, postCount: 0, lastActivityAt: null };
    for (const m of members) out[m.community_id].memberCount = Number(m.count);
    for (const p of posts) {
        out[p.community_id].postCount = Number(p.count);
        out[p.community_id].lastActivityAt = p.last_at;
    }
    return out;
}

async function getBySlug(ctx, slug) {
    const row = await db.Community.findOne({ where: { slug: slug.toLowerCase() } });
    if (!row) throw notFound('Community');
    // A private community's EXISTENCE is part of what membership protects, so a non-member
    // gets the same answer as for a community that does not exist.
    if (row.visibility === 'PRIVATE' && !ctx.communityIds.includes(row.id)) throw notFound('Community');
    const stats = await activityFor([row.id]);
    return serialize(row, ctx, stats[row.id]);
}

/**
 * The same community, addressed by id rather than slug.
 *
 * Exists because a case names its community by id, and the alternative the case page was
 * driven to — list every community and match client-side — is both wrong past one page of
 * results and a wasted query on every case view. The visibility rule is identical: a private
 * community answers 404 to a non-member, because its existence is part of what membership
 * protects.
 */
async function getById(ctx, id) {
    const row = await db.Community.findByPk(id);
    if (!row) throw notFound('Community');
    if (row.visibility === 'PRIVATE' && !ctx.communityIds.includes(row.id)) throw notFound('Community');
    const stats = await activityFor([row.id]);
    return serialize(row, ctx, stats[row.id]);
}

/**
 * The caller's role IN one community, or null. The single place that answers "may this person
 * administer this community", so the answer cannot drift between routes.
 *
 * Platform moderators are deliberately NOT admitted here. Running a community is a different
 * job from moderating the platform, and a platform moderator who wants to change a
 * community's description should ask its administrator; what they can already do is act on
 * reported content, through the moderation queue, where it is recorded.
 */
async function requireCommunityRole(ctx, communityId, roles) {
    const membership = await db.CommunityMember.findOne({
        where: { community_id: communityId, user_id: ctx.actor.userId, status: MEMBER_STATUS.ACTIVE },
    });
    if (!membership || !roles.includes(membership.role)) {
        throw forbidden('Only this community\'s administrators can do that.');
    }
    return membership;
}

/**
 * Edit the community's own description of itself.
 *
 * Deliberately narrow: name, description, purpose and rules. Not visibility, and not the
 * join policy — flipping a private community to public would expose every member who joined
 * on the understanding that it was not, and that is not an edit, it is a disclosure. Changing
 * either is a deliberate act for a later, separate flow with its own warning.
 */
async function update(ctx, id, input) {
    const row = await db.Community.findByPk(id);
    if (!row) throw notFound('Community');
    if (row.visibility === 'PRIVATE' && !ctx.communityIds.includes(row.id)) throw notFound('Community');
    await requireCommunityRole(ctx, id, ['ADMIN']);

    const patch = {};
    if (input.name !== undefined) patch.name = cleanText(input.name);
    if (input.description !== undefined) patch.description = cleanBody(input.description);
    if (input.purpose !== undefined) patch.purpose = cleanBody(input.purpose);
    if (input.rules !== undefined) patch.rules = cleanBody(input.rules);

    await row.update(patch);
    const stats = await activityFor([row.id]);
    return serialize(row, ctx, stats[row.id]);
}

/**
 * Decline a pending request to join.
 *
 * The row is deleted rather than marked, so somebody who was declined may ask again later —
 * a permanent record of "was turned away once" is not something this product should keep.
 * Banning is a separate, deliberate act.
 */
async function declineMember(ctx, communityId, userId) {
    await requireCommunityRole(ctx, communityId, ['MODERATOR', 'ADMIN']);
    const row = await db.CommunityMember.findOne({
        where: { community_id: communityId, user_id: userId, status: MEMBER_STATUS.PENDING },
    });
    if (!row) throw notFound('Pending request');
    await row.destroy();
    return { communityId, userId, status: 'DECLINED' };
}

/**
 * Remove somebody from a community.
 *
 * Marked LEFT, not banned and not deleted: it ends their access without asserting anything
 * about them. An administrator cannot be removed this way — a community must not be able to
 * lose the person responsible for it by accident, and never by another administrator acting
 * alone.
 */
async function removeMember(ctx, communityId, userId) {
    await requireCommunityRole(ctx, communityId, ['ADMIN']);
    if (userId === ctx.actor.userId) throw conflict('Use "leave" to remove yourself.');

    const row = await db.CommunityMember.findOne({
        where: { community_id: communityId, user_id: userId, status: MEMBER_STATUS.ACTIVE },
    });
    if (!row) throw notFound('Member');
    if (row.role === 'ADMIN') throw forbidden('An administrator cannot be removed by another administrator.');

    await row.update({ status: MEMBER_STATUS.LEFT });
    return serializeMembership(row);
}

async function create(ctx, input) {
    const slug = input.slug.toLowerCase();
    if (await db.Community.findOne({ where: { slug } })) throw conflict('That community address is already taken.', { slug: ['taken'] });

    const row = await db.sequelize.transaction(async (tx) => {
        const community = await db.Community.create({
            slug,
            name: cleanText(input.name),
            description: cleanBody(input.description),
            purpose: cleanBody(input.purpose),
            rules: cleanBody(input.rules),
            visibility: input.visibility,
            join_policy: input.joinPolicy,
            country_code: input.countryCode ? input.countryCode.toUpperCase() : null,
            region: cleanText(input.region),
            created_by: ctx.actor.userId,
        }, { transaction: tx });

        await db.CommunityMember.create({
            community_id: community.id,
            user_id: ctx.actor.userId,
            role: 'ADMIN',
            status: MEMBER_STATUS.ACTIVE,
            joined_at: new Date(),
        }, { transaction: tx });

        return community;
    });

    // The context was built before this community existed, so it must be told about the
    // membership just created — otherwise the creator is handed back a payload saying they
    // are not a member of the thing they have this second made, and myRole comes back null.
    return serialize(row, {
        ...ctx,
        communityIds: [...ctx.communityIds, row.id],
        membershipByCommunity: { ...(ctx.membershipByCommunity || {}), [row.id]: { status: 'ACTIVE', role: 'ADMIN' } },
    });
}

/**
 * Joining honours the community's own policy: OPEN admits immediately, REQUEST queues for
 * a moderator, INVITE cannot be self-served at all.
 */
async function join(ctx, communityId) {
    const community = await db.Community.findByPk(communityId);
    if (!community || !community.is_active) throw notFound('Community');
    if (community.join_policy === JOIN_POLICY.INVITE) throw forbidden('This community is invitation-only.');

    const existing = await db.CommunityMember.findOne({ where: { community_id: communityId, user_id: ctx.actor.userId } });
    if (existing) {
        if (existing.status === MEMBER_STATUS.BANNED) throw forbidden('You cannot join this community.');
        if (existing.status === MEMBER_STATUS.ACTIVE) throw conflict('You are already a member.');
        if (existing.status === MEMBER_STATUS.PENDING) throw conflict('Your request is already pending.');
        const status = community.join_policy === JOIN_POLICY.OPEN ? MEMBER_STATUS.ACTIVE : MEMBER_STATUS.PENDING;
        await existing.update({ status, joined_at: status === MEMBER_STATUS.ACTIVE ? new Date() : null });
        return serializeMembership(existing);
    }

    const status = community.join_policy === JOIN_POLICY.OPEN ? MEMBER_STATUS.ACTIVE : MEMBER_STATUS.PENDING;
    const created = await db.CommunityMember.create({
        community_id: communityId,
        user_id: ctx.actor.userId,
        status,
        joined_at: status === MEMBER_STATUS.ACTIVE ? new Date() : null,
    });
    return serializeMembership(created);
}

async function leave(ctx, communityId) {
    const row = await db.CommunityMember.findOne({ where: { community_id: communityId, user_id: ctx.actor.userId } });
    if (!row) throw notFound('Membership');
    await row.update({ status: MEMBER_STATUS.LEFT });
    return serializeMembership(row);
}

/**
 * Admit a pending member. Called by a community moderator; the person is told, because a
 * request that is approved silently is indistinguishable from one that was ignored.
 */
async function approveMember(ctx, communityId, userId) {
    const community = await db.Community.findByPk(communityId);
    if (!community) throw notFound('Community');

    const actor = await db.CommunityMember.findOne({
        where: { community_id: communityId, user_id: ctx.actor.userId, status: MEMBER_STATUS.ACTIVE },
    });
    if (!actor || !['MODERATOR', 'ADMIN'].includes(actor.role)) {
        throw forbidden('Only a community moderator can approve a request to join.');
    }

    const row = await db.CommunityMember.findOne({ where: { community_id: communityId, user_id: userId } });
    if (!row) throw notFound('Membership');
    if (row.status === MEMBER_STATUS.ACTIVE) throw conflict('They are already a member.');

    await row.update({ status: MEMBER_STATUS.ACTIVE, joined_at: new Date() });
    await notificationService.notify(userId, notificationService.EVENT.joinApproved(community.slug), ctx.actor.userId);
    return serializeMembership(row);
}

/**
 * Who is in this community.
 *
 * Members may see the active roster. PENDING is a different matter and is restricted to the
 * people who act on it: who has ASKED to join a community about family opposition is at
 * least as sensitive as who is in it, and an ordinary member has no reason to know that
 * somebody applied — still less that they were turned down.
 */
async function listMembers(ctx, communityId, { page, pageSize, status }) {
    const community = await db.Community.findByPk(communityId);
    if (!community) throw notFound('Community');
    if (!ctx.communityIds.includes(communityId)) throw notFound('Community');

    const wanted = status || MEMBER_STATUS.ACTIVE;
    if (wanted === MEMBER_STATUS.PENDING) await requireCommunityRole(ctx, communityId, ['MODERATOR', 'ADMIN']);
    else if (wanted !== MEMBER_STATUS.ACTIVE) throw badRequest('Members can be listed as active or pending.');

    const { rows, count } = await db.CommunityMember.findAndCountAll({
        where: { community_id: communityId, status: wanted },
        order: [[wanted === MEMBER_STATUS.PENDING ? 'created_at' : 'joined_at', 'ASC']],
        limit: pageSize,
        offset: (page - 1) * pageSize,
    });
    return { items: rows.map(serializeMembership), total: count };
}

const serialize = (c, ctx, stats) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description,
    purpose: c.purpose,
    rules: c.rules,
    visibility: c.visibility,
    joinPolicy: c.join_policy,
    countryCode: c.country_code,
    region: c.region,
    isMember: Boolean(ctx && ctx.communityIds.includes(c.id)),
    // The caller's OWN membership, and only their own. NONE / PENDING / ACTIVE, so a person
    // waiting on approval is told they are waiting rather than shown a stranger's view of a
    // place they have already asked to join. `myRole` is what lets the client draw a
    // management surface for an administrator; it is null for everybody else, and it confers
    // nothing on its own — every management route re-checks the role server-side.
    membershipStatus: membershipOf(ctx, c.id).status,
    myRole: membershipOf(ctx, c.id).role,
    memberCount: stats ? stats.memberCount : 0,
    postCount: stats ? stats.postCount : 0,
    lastActivityAt: stats ? stats.lastActivityAt : null,
    createdAt: c.created_at,
});

/** The caller's own membership of one community, as { status, role }. Never anyone else's. */
function membershipOf(ctx, communityId) {
    const m = ctx && ctx.membershipByCommunity && ctx.membershipByCommunity[communityId];
    if (!m) return { status: 'NONE', role: null };
    return { status: m.status, role: m.status === 'ACTIVE' ? m.role : null };
}

const serializeMembership = (m) => ({
    id: m.id,
    communityId: m.community_id,
    userId: m.user_id,
    role: m.role,
    status: m.status,
    joinedAt: m.joined_at,
});

module.exports = {
    serialize,
    list, getBySlug, getById, create, update, join, leave,
    approveMember, declineMember, removeMember, listMembers,
    activityFor, MEMBER_STATUS, JOIN_POLICY,
};
