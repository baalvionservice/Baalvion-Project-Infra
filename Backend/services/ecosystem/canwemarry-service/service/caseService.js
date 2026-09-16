'use strict';
const crypto = require('node:crypto');
const db = require('../models');
const config = require('../config/appConfig');
const visibility = require('../domain/visibility');
const { CONSENT, RELATION, visibleParticipants } = require('../domain/consent');
const { PERMISSIONS, can } = require('../domain/permissions');
const { cleanText, cleanBody } = require('../utils/sanitize');
const { badRequest, notFound, forbidden, conflict } = require('../utils/errors');
const { evaluate } = require('../domain/verification');

const { VISIBILITY, CASE_STATUS, MODERATION_STATE, VIEW_LEVEL } = visibility;

// Crockford-style alphabet: no I, L, O or U, so a reference read aloud over the phone to a
// support worker does not come back with a character swapped.
const REF_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function newReference() {
    // Rejection-sampled rather than `randomBytes % length`, which is uniform only while the
    // alphabet divides 256. See invitationService.mintToken for the same reasoning; a
    // reference is not a credential, but a skewed one collides sooner.
    let out = '';
    for (let i = 0; i < 6; i += 1) out += REF_ALPHABET[crypto.randomInt(REF_ALPHABET.length)];
    return `CWM-${out}`;
}

/**
 * Read one case. `ctx` is the AccessContext from service/accessContext.js.
 *
 * A case the actor may not see raises the same 404 as one that does not exist: a 403 here
 * would confirm that a particular private case is real, which is precisely what someone
 * hunting for a relative's case would be probing for.
 */
async function get(ctx, id) {
    const row = await db.Case.findByPk(id);
    if (!row) throw notFound('Case');
    const level = visibility.viewLevel(ctx, row);
    if (level === VIEW_LEVEL.NONE) throw notFound('Case');

    const participants = level === VIEW_LEVEL.SUMMARY
        ? []
        : await db.CaseParticipant.findAll({ where: { case_id: row.id }, raw: true });

    return serialize(row, level, { participants, viewerUserId: ctx.actor.userId });
}

/** Read by the human-facing reference, for someone given a case handle by its owner. */
async function getByReference(ctx, reference) {
    const row = await db.Case.findOne({ where: { reference: reference.toUpperCase() } });
    if (!row) throw notFound('Case');
    return get(ctx, row.id);
}

/**
 * List cases the actor is entitled to.
 *
 * The visibility predicate is ANDed into the query rather than applied to the results, so
 * an unauthorized case is never selected, never counted and never influences pagination.
 */
const SORTS = {
    recent: [['created_at', 'DESC']],
    oldest: [['created_at', 'ASC']],
    supported: [['supporter_count', 'DESC'], ['created_at', 'DESC']],
    updated: [['updated_at', 'DESC']],
};

async function list(ctx, { page, pageSize, status, communityId, visibility: vis, mine, supporting, countryCode, q, sort, supportNeeded }) {
    const filters = [visibility.scopeWhere(ctx)];

    if (status) filters.push({ status });
    else filters.push({ status: { [db.Op.ne]: CASE_STATUS.DRAFT } });

    if (communityId) filters.push({ community_id: communityId });
    if (vis) filters.push({ visibility: vis });
    if (countryCode) filters.push({ country_code: countryCode.toUpperCase() });
    if (mine) {
        if (!ctx.actor.userId) throw forbidden('Sign in to see your own cases.');
        filters.push({ owner_id: ctx.actor.userId });
    }
    if (supporting) {
        if (!ctx.actor.userId) throw forbidden('Sign in to see the cases you support.');
        filters.push({ id: { [db.Op.in]: ctx.supporterCaseIds } });
    }

    // Search is ANDed into the same predicate as the visibility scope, never applied to the
    // results. A search that could match a case the caller may not see would let someone
    // confirm a private case exists by probing for words they expect to be in it.
    if (q) {
        const like = `%${q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
        filters.push({ [db.Op.or]: [
            { title: { [db.Op.iLike]: like } },
            { summary: { [db.Op.iLike]: like } },
            { reference: { [db.Op.iLike]: like } },
        ] });
    }
    if (supportNeeded) filters.push({ support_needed: { [db.Op.contains]: [supportNeeded] } });

    const { rows, count } = await db.Case.findAndCountAll({
        where: { [db.Op.and]: filters },
        order: SORTS[sort] || SORTS.recent,
        limit: pageSize,
        offset: (page - 1) * pageSize,
    });

    // The row-level level is recomputed per case: a list can legitimately mix a case the
    // actor owns with one they can only see the summary of.
    return {
        items: rows.map((r) => serialize(r, visibility.viewLevel(ctx, r), { participants: [], viewerUserId: ctx.actor.userId })),
        total: count,
    };
}

/**
 * Leaving DRAFT is the moment a case stops being private notes and becomes something other
 * people can find, support and comment on. That is the act email verification gates — not
 * writing a case, which endangers nobody.
 *
 * Enforced here rather than on the route because `create` (with an explicit status) and
 * `update` (moving the status) are two doors into the same act; a route-level gate would
 * catch one and miss the other.
 */
function assertMayPublish(ctx) {
    const result = evaluate(ctx.actor.verification, 'case:publish', {
        enforceOnUnknown: config.security.requireEmailVerification,
    });
    if (result.allowed) return;
    throw forbidden(
        result.reason === 'EMAIL_NOT_VERIFIED'
            ? 'Confirm your email address before opening your case to others. Your draft is saved — nothing is lost.'
            : 'Opening a case needs a confirmed email address, and we cannot currently check yours. Your draft is saved; please try again shortly.',
    );
}

async function create(ctx, input) {
    const actorId = ctx.actor.userId;

    if (input.visibility === VISIBILITY.PUBLIC && !config.features.allowPublicCases) {
        throw forbidden('Site-wide public cases are not enabled on this deployment.');
    }
    if (input.visibility === VISIBILITY.COMMUNITY) {
        if (!input.communityId) throw badRequest('A community-visible case must name its community.', { communityId: ['required'] });
        const member = await db.CommunityMember.findOne({
            where: { community_id: input.communityId, user_id: actorId, status: 'ACTIVE' },
        });
        if (!member) throw forbidden('You can only scope a case to a community you belong to.');
    }

    // A backstop against one account filling the moderation queue, not a product limit —
    // resolved and closed cases do not count against it.
    const open = await db.Case.count({
        where: { owner_id: actorId, status: { [db.Op.in]: [CASE_STATUS.DRAFT, CASE_STATUS.OPEN, CASE_STATUS.ON_HOLD] } },
    });
    if (open >= config.limits.maxOpenCasesPerUser) {
        throw conflict(`You already have ${open} open cases. Close or resolve one before opening another.`);
    }

    if (input.status && input.status !== CASE_STATUS.DRAFT) assertMayPublish(ctx);

    const row = await db.sequelize.transaction(async (tx) => {
        const created = await db.Case.create({
            reference: newReference(),
            owner_id: actorId,
            community_id: input.communityId || null,
            title: cleanText(input.title),
            summary: cleanBody(input.summary),
            situation: cleanBody(input.situation),
            support_needed: input.supportNeeded || [],
            visibility: input.visibility,
            status: input.status || CASE_STATUS.DRAFT,
            country_code: input.countryCode ? input.countryCode.toUpperCase() : null,
            region: cleanText(input.region),
            allow_supporter_requests: input.allowSupporterRequests !== false,
        }, { transaction: tx });

        // The owner is a participant of their own case with implicit consent, so the
        // consent rules have a uniform shape and there is no special case in the reader.
        await db.CaseParticipant.create({
            case_id: created.id,
            user_id: actorId,
            relation: RELATION.SELF,
            consent_status: CONSENT.SELF,
            invited_by: actorId,
            responded_at: new Date(),
        }, { transaction: tx });

        return created;
    });

    return serialize(row, VIEW_LEVEL.INTERNAL, { participants: [], viewerUserId: actorId });
}

async function update(ctx, id, input) {
    const row = await db.Case.findByPk(id);
    if (!row || visibility.viewLevel(ctx, row) === VIEW_LEVEL.NONE) throw notFound('Case');
    if (!visibility.canUpdate(ctx, row)) throw forbidden('Only the person who opened a case can edit it.');
    if (row.is_locked) throw forbidden('This case is locked and cannot be edited.');

    const patch = {};
    if (input.title !== undefined) patch.title = cleanText(input.title);
    if (input.summary !== undefined) patch.summary = cleanBody(input.summary);
    if (input.situation !== undefined) patch.situation = cleanBody(input.situation);
    if (input.supportNeeded !== undefined) patch.support_needed = input.supportNeeded;
    if (input.region !== undefined) patch.region = cleanText(input.region);
    if (input.countryCode !== undefined) patch.country_code = input.countryCode ? input.countryCode.toUpperCase() : null;
    if (input.allowSupporterRequests !== undefined) patch.allow_supporter_requests = input.allowSupporterRequests;
    if (input.status !== undefined) {
        if (row.status === CASE_STATUS.DRAFT && input.status !== CASE_STATUS.DRAFT) assertMayPublish(ctx);
        patch.status = input.status;
        patch.resolved_at = input.status === CASE_STATUS.RESOLVED ? new Date() : null;
    }

    if (input.visibility !== undefined && input.visibility !== row.visibility) {
        patch.visibility = await resolveVisibilityChange(ctx, row, input);
        if (patch.visibility === VISIBILITY.COMMUNITY) patch.community_id = input.communityId || row.community_id;
    }

    await row.update(patch);
    return serialize(row, VIEW_LEVEL.INTERNAL, { participants: [], viewerUserId: ctx.actor.userId });
}

/**
 * Widening a case's audience is the single most consequential edit its owner can make, so
 * each target is checked on its own terms rather than trusted from the payload.
 */
async function resolveVisibilityChange(ctx, row, input) {
    const target = input.visibility;
    if (target === VISIBILITY.PUBLIC && !config.features.allowPublicCases) {
        throw forbidden('Site-wide public cases are not enabled on this deployment.');
    }
    if (target === VISIBILITY.COMMUNITY) {
        const communityId = input.communityId || row.community_id;
        if (!communityId) throw badRequest('A community-visible case must name its community.', { communityId: ['required'] });
        const member = await db.CommunityMember.findOne({
            where: { community_id: communityId, user_id: ctx.actor.userId, status: 'ACTIVE' },
        });
        if (!member) throw forbidden('You can only scope a case to a community you belong to.');
    }
    return target;
}

/**
 * Deleting a case removes its participants, supporters and comments with it (ON DELETE
 * CASCADE in 001_init.sql). That is intentional: someone withdrawing from the platform
 * should not leave a discussion of their marriage behind.
 */
async function remove(ctx, id) {
    const row = await db.Case.findByPk(id);
    if (!row || visibility.viewLevel(ctx, row) === VIEW_LEVEL.NONE) throw notFound('Case');
    if (!visibility.canDelete(ctx, row)) throw forbidden('Only the person who opened a case can delete it.');
    await db.Comment.destroy({ where: { target_type: 'CASE', target_id: row.id } });
    await row.destroy();
    return { id, deleted: true };
}

/**
 * Shape a case for one viewer.
 *
 * SUMMARY is what a stranger on a public case gets: the owner's own words and nothing
 * about who else is involved. PARTICIPANT and INTERNAL add the participant list, itself
 * filtered by consent in domain/consent.js.
 */
function serialize(row, level, { participants = [], viewerUserId = null } = {}) {
    const base = {
        id: row.id,
        reference: row.reference,
        title: row.title,
        summary: row.summary,
        supportNeeded: row.support_needed,
        visibility: row.visibility,
        status: row.status,
        countryCode: row.country_code,
        region: row.region,
        communityId: row.community_id,
        supporterCount: row.supporter_count,
        commentCount: row.comment_count,
        isLocked: row.is_locked,
        allowSupporterRequests: row.allow_supporter_requests,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        resolvedAt: row.resolved_at,
        viewLevel: level,
    };

    if (level === VIEW_LEVEL.SUMMARY) return base;

    return {
        ...base,
        situation: row.situation,
        ownerId: row.owner_id,
        moderationState: row.moderation_state,
        participants: visibleParticipants(participants, viewerUserId),
    };
}

/** Moderation writes go through moderationService; this is the state mutation it calls. */
async function setModerationState(id, state) {
    const row = await db.Case.findByPk(id);
    if (!row) throw notFound('Case');
    await row.update({ moderation_state: state });
    return row;
}

async function setLocked(id, locked) {
    const row = await db.Case.findByPk(id);
    if (!row) throw notFound('Case');
    await row.update({ is_locked: locked });
    return row;
}

module.exports = {
    get, getByReference, list, create, update, remove,
    serialize, setModerationState, setLocked, newReference,
    VISIBILITY, CASE_STATUS, MODERATION_STATE,
    canView: (ctx, row) => visibility.canView(ctx, row),
    canModerate: (ctx) => can(ctx.actor, PERMISSIONS.CASE_MODERATE),
};
