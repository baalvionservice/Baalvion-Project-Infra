'use strict';
const db = require('../models');
const { ACTIVE_CONSENT } = require('../domain/consent');
const { anonymousContext } = require('../domain/visibility');

/**
 * Builds the AccessContext that domain/visibility.js reasons over: which communities the
 * actor belongs to, which cases they are a consenting participant in, and which they have
 * been accepted to support.
 *
 * Three narrow indexed lookups, resolved once and memoised on the request. Loading them up
 * front is what lets the case list apply its visibility rule inside the SQL query rather
 * than filtering rows after the fact.
 */
async function build(req) {
    if (req._accessContext) return req._accessContext;

    const actor = req.actor || { userId: null, roles: [] };
    if (!actor.userId) {
        req._accessContext = anonymousContext();
        return req._accessContext;
    }

    const [memberships, participations, supports] = await Promise.all([
        // PENDING is fetched alongside ACTIVE, but the two are kept apart below. Only ACTIVE
        // grants sight of anything; PENDING exists so the UI can say "waiting for approval"
        // rather than showing somebody the stranger's view of a community they have asked to
        // join. Conflating them here would be a visibility bug, so `communityIds` — the list
        // domain/visibility.js reasons over — is still built from ACTIVE alone.
        db.CommunityMember.findAll({
            where: { user_id: actor.userId, status: { [db.Op.in]: ['ACTIVE', 'PENDING'] } },
            attributes: ['community_id', 'status', 'role'],
            raw: true,
        }),
        db.CaseParticipant.findAll({
            where: { user_id: actor.userId, consent_status: ACTIVE_CONSENT },
            attributes: ['case_id'],
            raw: true,
        }),
        db.CaseSupporter.findAll({
            where: { user_id: actor.userId, status: 'ACCEPTED' },
            attributes: ['case_id'],
            raw: true,
        }),
    ]);

    const active = memberships.filter((m) => m.status === 'ACTIVE');

    req._accessContext = {
        actor,
        communityIds: active.map((m) => m.community_id),
        // Presentation only: { <communityId>: { status, role } } for the caller's own
        // memberships. Never consulted by the visibility rules.
        membershipByCommunity: Object.fromEntries(
            memberships.map((m) => [m.community_id, { status: m.status, role: m.role }]),
        ),
        participantCaseIds: participations.map((p) => p.case_id),
        supporterCaseIds: supports.map((s) => s.case_id),
    };
    return req._accessContext;
}

module.exports = { build };
