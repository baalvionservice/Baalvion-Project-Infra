'use strict';
/**
 * Case visibility — the one place that decides who may see what.
 *
 * The rule set is expressed TWICE on purpose, and the two must stay in step:
 *
 *   scopeWhere()  builds the SQL predicate for LIST queries, so a case the caller
 *                 may not see is never selected in the first place. Filtering rows
 *                 out after the query is how counts, pagination and aggregates leak
 *                 the existence of private cases even when the bodies are withheld.
 *   canView()     answers the same question for one already-loaded row.
 *
 * `__tests__/visibility.test.js` asserts the two agree over a matrix of cases and
 * actors, which is what keeps the duplication honest.
 *
 * Everything here is pure: it takes an access context and plain rows, touches no
 * database and no request object, so the rules can be unit-tested exhaustively and
 * reused unchanged by any future client (including the Expo app's backend calls).
 */

const { Op } = require('sequelize');
const { PERMISSIONS, can } = require('./permissions');

const VISIBILITY = Object.freeze({ PUBLIC: 'PUBLIC', COMMUNITY: 'COMMUNITY', PRIVATE: 'PRIVATE' });
const CASE_STATUS = Object.freeze({ DRAFT: 'DRAFT', OPEN: 'OPEN', ON_HOLD: 'ON_HOLD', RESOLVED: 'RESOLVED', CLOSED: 'CLOSED' });
const MODERATION_STATE = Object.freeze({ VISIBLE: 'VISIBLE', UNDER_REVIEW: 'UNDER_REVIEW', HIDDEN: 'HIDDEN', REMOVED: 'REMOVED' });

// Moderation states in which content is still shown to the people entitled to it.
// UNDER_REVIEW is deliberately among them: a case is flagged the moment somebody
// reports it, and hiding on report alone would hand anyone a mute button over any
// case they disliked — including a family wanting a case about them taken down.
// Withholding is a moderator's decision (HIDDEN), never an automatic consequence.
const READABLE_STATES = Object.freeze(['VISIBLE', 'UNDER_REVIEW']);

// How much of a case a given viewer is entitled to. Ordered least → most.
const VIEW_LEVEL = Object.freeze({ NONE: 'NONE', SUMMARY: 'SUMMARY', PARTICIPANT: 'PARTICIPANT', INTERNAL: 'INTERNAL' });

/**
 * @typedef {object} AccessContext
 * @property {{ userId: string|null, roles: string[] }} actor
 * @property {string[]} communityIds        communities the actor is an ACTIVE member of
 * @property {string[]} participantCaseIds  cases the actor is a CONSENTING participant in
 * @property {string[]} supporterCaseIds    cases the actor is an ACCEPTED supporter of
 */

/** An access context for a caller with no account and no memberships. */
const anonymousContext = () => ({
    actor: { userId: null, roles: [] },
    communityIds: [],
    membershipByCommunity: {},
    participantCaseIds: [],
    supporterCaseIds: [],
});

const isModerator = (ctx) => can(ctx.actor, PERMISSIONS.CASE_MODERATE);
const isOwner = (ctx, row) => Boolean(ctx.actor.userId) && row.owner_id === ctx.actor.userId;
const isParticipant = (ctx, row) => ctx.participantCaseIds.includes(row.id);
const isSupporter = (ctx, row) => ctx.supporterCaseIds.includes(row.id);
const inCommunity = (ctx, row) => Boolean(row.community_id) && ctx.communityIds.includes(row.community_id);

/**
 * SQL predicate restricting a case query to what this actor may see.
 * Compose it with `[Op.and]` alongside any caller-supplied filters — never replace it.
 */
function scopeWhere(ctx) {
    if (isModerator(ctx)) return {}; // staff see every case, including removed ones

    const { userId } = ctx.actor;

    // Withheld from everyone but staff, regardless of who owns or supports the case.
    const notRemoved = { moderation_state: { [Op.ne]: MODERATION_STATE.REMOVED } };

    const reachable = [
        // Published to the whole site.
        { visibility: VISIBILITY.PUBLIC, status: { [Op.ne]: CASE_STATUS.DRAFT }, moderation_state: { [Op.in]: READABLE_STATES } },
    ];

    if (userId) {
        // Scoped to a community the actor actually belongs to.
        if (ctx.communityIds.length) {
            reachable.push({
                visibility: VISIBILITY.COMMUNITY,
                community_id: { [Op.in]: ctx.communityIds },
                status: { [Op.ne]: CASE_STATUS.DRAFT },
                moderation_state: { [Op.in]: READABLE_STATES },
            });
        }
        // Cases the actor is inside: their own, ones they consented to, ones they support.
        // A hidden case stays reachable to its own owner so they can see the moderation
        // outcome rather than watch it vanish, but not to supporters or the community.
        reachable.push({ owner_id: userId });
        const invited = [...ctx.participantCaseIds, ...ctx.supporterCaseIds];
        if (invited.length) {
            // Drafts are excluded even here. A draft is the author's working copy, not yet
            // shared with anyone; without this clause an invited participant could list a
            // case its owner had not decided to open.
            reachable.push({
                id: { [Op.in]: invited },
                status: { [Op.ne]: CASE_STATUS.DRAFT },
                moderation_state: { [Op.in]: READABLE_STATES },
            });
        }
    }

    return { [Op.and]: [notRemoved, { [Op.or]: reachable }] };
}

/** Does this actor's relationship to the row permit reading it at all? */
function canView(ctx, row) {
    return viewLevel(ctx, row) !== VIEW_LEVEL.NONE;
}

/** How much of the row this actor is entitled to. The serializer keys off this. */
function viewLevel(ctx, row) {
    if (!row) return VIEW_LEVEL.NONE;
    if (isModerator(ctx)) return VIEW_LEVEL.INTERNAL;
    if (row.moderation_state === MODERATION_STATE.REMOVED) return VIEW_LEVEL.NONE;
    if (isOwner(ctx, row)) return VIEW_LEVEL.INTERNAL;

    // A draft belongs to nobody but its author until it is opened.
    if (row.status === CASE_STATUS.DRAFT) return VIEW_LEVEL.NONE;
    // Hidden by a moderator: owner and staff only, both handled above. UNDER_REVIEW is
    // not hidden — see READABLE_STATES.
    if (!READABLE_STATES.includes(row.moderation_state)) return VIEW_LEVEL.NONE;

    if (isParticipant(ctx, row) || isSupporter(ctx, row)) return VIEW_LEVEL.PARTICIPANT;

    if (row.visibility === VISIBILITY.PUBLIC) return VIEW_LEVEL.SUMMARY;
    if (row.visibility === VISIBILITY.COMMUNITY && inCommunity(ctx, row)) return VIEW_LEVEL.SUMMARY;

    // PRIVATE, or COMMUNITY without membership.
    return VIEW_LEVEL.NONE;
}

/** Only the owner edits a case's content. Moderators act through moderation actions, not edits. */
function canUpdate(ctx, row) {
    return isOwner(ctx, row) && can(ctx.actor, PERMISSIONS.CASE_UPDATE);
}

function canDelete(ctx, row) {
    if (isOwner(ctx, row) && can(ctx.actor, PERMISSIONS.CASE_DELETE)) return true;
    return can(ctx.actor, PERMISSIONS.ADMIN_CASES);
}

/**
 * May this actor offer support on this case?
 * Voluntary on both sides: the case has to be accepting offers, and the actor must not
 * already be inside the case. Acceptance remains the owner's decision.
 */
function canOfferSupport(ctx, row) {
    if (!ctx.actor.userId) return false;
    if (!can(ctx.actor, PERMISSIONS.CASE_SUPPORT)) return false;
    if (!row.allow_supporter_requests) return false;
    if (row.status !== CASE_STATUS.OPEN) return false;
    if (isOwner(ctx, row) || isParticipant(ctx, row)) return false;
    return viewLevel(ctx, row) !== VIEW_LEVEL.NONE;
}

/** Commenting is for people inside the case or inside its community — never the open internet. */
function canComment(ctx, row) {
    if (!ctx.actor.userId) return false;
    if (row.is_locked) return isModerator(ctx);
    const level = viewLevel(ctx, row);
    if (level === VIEW_LEVEL.NONE) return false;
    if (level === VIEW_LEVEL.INTERNAL || level === VIEW_LEVEL.PARTICIPANT) return true;
    return row.visibility === VISIBILITY.COMMUNITY && inCommunity(ctx, row);
}

module.exports = {
    VISIBILITY,
    READABLE_STATES,
    CASE_STATUS,
    MODERATION_STATE,
    VIEW_LEVEL,
    anonymousContext,
    scopeWhere,
    canView,
    viewLevel,
    canUpdate,
    canDelete,
    canOfferSupport,
    canComment,
    isOwner,
    isModerator,
};
