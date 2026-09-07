'use strict';
/**
 * Participant consent.
 *
 * A case about a relationship necessarily concerns more than one person, and most of
 * them have not agreed to be discussed on a website. Two rules follow, and both are
 * structural rather than advisory:
 *
 *  1. A participant row can only ever hold a platform user id and a relation label.
 *     There is no name, address, phone or photo column on case_participants — see
 *     migrations/001_init.sql. A non-consenting person therefore cannot be identified
 *     through this table even by an operator with database access.
 *
 *  2. An invited participant is invisible until they accept. Until consent is GRANTED
 *     the case owner sees "one invitation pending" and nothing else about them; their
 *     user id is not returned to anyone but themselves.
 *
 * Withdrawal is always available and takes effect immediately, which is why WITHDRAWN
 * is a terminal state that reverts the row to the same exposure as INVITED.
 */

const CONSENT = Object.freeze({
    /** The case owner. Consent is implicit — they wrote the case about themselves. */
    SELF: 'SELF',
    /** Asked, not yet answered. Identity withheld from everyone but the invitee. */
    INVITED: 'INVITED',
    GRANTED: 'GRANTED',
    DECLINED: 'DECLINED',
    WITHDRAWN: 'WITHDRAWN',
});

const RELATION = Object.freeze({
    SELF: 'SELF',
    PARTNER: 'PARTNER',
    FAMILY_MEMBER: 'FAMILY_MEMBER',
    MEDIATOR: 'MEDIATOR',
    LEGAL_ADVISOR: 'LEGAL_ADVISOR',
    COUNSELLOR: 'COUNSELLOR',
    OTHER: 'OTHER',
});

const ALL_CONSENT = Object.freeze(Object.values(CONSENT));
const ALL_RELATIONS = Object.freeze(Object.values(RELATION));

/** States in which the participant is an active, consenting member of the case. */
const ACTIVE_CONSENT = Object.freeze([CONSENT.SELF, CONSENT.GRANTED]);

const isActive = (status) => ACTIVE_CONSENT.includes(status);

/** Legal transitions. Anything absent from this map is rejected by participantService. */
const TRANSITIONS = Object.freeze({
    [CONSENT.INVITED]: Object.freeze([CONSENT.GRANTED, CONSENT.DECLINED]),
    [CONSENT.GRANTED]: Object.freeze([CONSENT.WITHDRAWN]),
    [CONSENT.DECLINED]: Object.freeze([]),
    [CONSENT.WITHDRAWN]: Object.freeze([]),
    // The owner cannot resign from their own case; they close or delete it instead.
    [CONSENT.SELF]: Object.freeze([]),
});

function canTransition(from, to) {
    return (TRANSITIONS[from] || []).includes(to);
}

/**
 * Only the invitee themselves may answer an invitation. Not the case owner, not a
 * moderator, not an admin — consent that someone else can grant on your behalf is not
 * consent, and an admin override here would be the single most dangerous capability
 * on the platform.
 */
function canRespond(actorUserId, participantRow) {
    return Boolean(actorUserId) && participantRow.user_id === actorUserId;
}

/**
 * The participant list as a given viewer is entitled to see it.
 * Identities appear only for consenting participants, plus the viewer's own row.
 * Everyone else is reduced to a bare relation label so the case still reads coherently
 * ("a family member was invited") without naming anyone who did not agree to be named.
 */
function visibleParticipants(rows, viewerUserId) {
    return rows.map((r) => {
        const isSelf = Boolean(viewerUserId) && r.user_id === viewerUserId;
        const identified = isActive(r.consent_status) || isSelf;
        return {
            id: r.id,
            // Which case this belongs to. Safe to include: a participant row only ever
            // reaches someone who can already see that case, or the invitee themselves —
            // and an invitee has to know what they are being asked to join.
            caseId: r.case_id,
            relation: r.relation,
            consentStatus: r.consent_status,
            userId: identified ? r.user_id : null,
            isSelf,
            invitedAt: r.invited_at,
            respondedAt: identified ? r.responded_at : null,
        };
    });
}

module.exports = {
    CONSENT,
    RELATION,
    ALL_CONSENT,
    ALL_RELATIONS,
    ACTIVE_CONSENT,
    TRANSITIONS,
    isActive,
    canTransition,
    canRespond,
    visibleParticipants,
};
