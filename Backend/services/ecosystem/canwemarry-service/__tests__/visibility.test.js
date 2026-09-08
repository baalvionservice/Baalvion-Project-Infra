'use strict';
const { Op } = require('sequelize');
const visibility = require('../domain/visibility');
const { ROLES } = require('../domain/roles');

const { VISIBILITY, CASE_STATUS, MODERATION_STATE, VIEW_LEVEL, scopeWhere, viewLevel, canView } = visibility;

// A minimal interpreter for the Sequelize `where` fragment scopeWhere() produces. It lets
// the suite check the predicate the DATABASE would apply against the same rows canView()
// judges, which is the only way to prove the two halves of the rule agree — the SQL path is
// where a private case would actually leak.
function matches(where, row) {
    // Reflect.ownKeys, not Object.keys: the predicate's top-level keys are Op symbols,
    // which Object.keys does not see — an emptiness check that misses them would make
    // this whole matcher answer 'true' for every row and quietly assert nothing.
    if (!where || Reflect.ownKeys(where).length === 0) return true;
    for (const key of Reflect.ownKeys(where)) {
        const value = where[key];
        if (key === Op.and) { if (!value.every((w) => matches(w, row))) return false; continue; }
        if (key === Op.or) { if (!value.some((w) => matches(w, row))) return false; continue; }
        if (!matchField(row[key], value)) return false;
    }
    return true;
}

function matchField(actual, expected) {
    if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
        for (const op of Reflect.ownKeys(expected)) {
            if (op === Op.ne && actual === expected[op]) return false;
            else if (op === Op.in && !expected[op].includes(actual)) return false;
        }
        return true;
    }
    return actual === expected;
}

const OWNER = 'owner-1';
const OUTSIDER = 'outsider-1';
const COMMUNITY = 'community-1';

const caseRow = (over = {}) => ({
    id: 'case-1',
    owner_id: OWNER,
    community_id: null,
    visibility: VISIBILITY.PRIVATE,
    status: CASE_STATUS.OPEN,
    moderation_state: MODERATION_STATE.VISIBLE,
    is_locked: false,
    allow_supporter_requests: true,
    ...over,
});

const ctx = (over = {}) => ({
    actor: { userId: OUTSIDER, roles: [ROLES.USER] },
    communityIds: [],
    participantCaseIds: [],
    supporterCaseIds: [],
    ...over,
});

const anonymous = visibility.anonymousContext();
const owner = ctx({ actor: { userId: OWNER, roles: [ROLES.USER] } });
const moderator = ctx({ actor: { userId: 'mod-1', roles: [ROLES.MODERATOR] } });
const member = ctx({ communityIds: [COMMUNITY] });
const participant = ctx({ participantCaseIds: ['case-1'] });
const supporter = ctx({ supporterCaseIds: ['case-1'] });

describe('private cases', () => {
    const row = caseRow({ visibility: VISIBILITY.PRIVATE });

    test('are invisible to an anonymous visitor', () => {
        expect(canView(anonymous, row)).toBe(false);
    });

    test('are invisible to a signed-in stranger', () => {
        expect(canView(ctx(), row)).toBe(false);
    });

    test('are invisible to a member of an unrelated community', () => {
        expect(canView(member, row)).toBe(false);
    });

    test('are visible to the owner in full', () => {
        expect(viewLevel(owner, row)).toBe(VIEW_LEVEL.INTERNAL);
    });

    test('are visible to a consenting participant and an accepted supporter', () => {
        expect(viewLevel(participant, row)).toBe(VIEW_LEVEL.PARTICIPANT);
        expect(viewLevel(supporter, row)).toBe(VIEW_LEVEL.PARTICIPANT);
    });

    test('are visible to a moderator', () => {
        expect(viewLevel(moderator, row)).toBe(VIEW_LEVEL.INTERNAL);
    });
});

describe('community cases', () => {
    const row = caseRow({ visibility: VISIBILITY.COMMUNITY, community_id: COMMUNITY });

    test('require membership of that specific community', () => {
        expect(canView(member, row)).toBe(true);
        expect(canView(ctx({ communityIds: ['other-community'] }), row)).toBe(false);
        expect(canView(ctx(), row)).toBe(false);
    });

    test('are not readable anonymously', () => {
        expect(canView(anonymous, row)).toBe(false);
    });

    test('expose only the summary to a fellow member', () => {
        expect(viewLevel(member, row)).toBe(VIEW_LEVEL.SUMMARY);
    });
});

describe('public cases', () => {
    const row = caseRow({ visibility: VISIBILITY.PUBLIC });

    test('are readable by anyone, at summary level', () => {
        expect(viewLevel(anonymous, row)).toBe(VIEW_LEVEL.SUMMARY);
        expect(viewLevel(ctx(), row)).toBe(VIEW_LEVEL.SUMMARY);
    });

    test('still expose the full record to the people inside them', () => {
        expect(viewLevel(owner, row)).toBe(VIEW_LEVEL.INTERNAL);
        expect(viewLevel(participant, row)).toBe(VIEW_LEVEL.PARTICIPANT);
    });
});

describe('drafts and moderated cases', () => {
    test('a draft is visible to nobody but its author', () => {
        const row = caseRow({ visibility: VISIBILITY.PUBLIC, status: CASE_STATUS.DRAFT });
        expect(canView(owner, row)).toBe(true);
        expect(canView(anonymous, row)).toBe(false);
        expect(canView(ctx(), row)).toBe(false);
        expect(canView(supporter, row)).toBe(false);
    });

    test('a hidden case stays visible to its owner and to staff, and to nobody else', () => {
        const row = caseRow({ visibility: VISIBILITY.PUBLIC, moderation_state: MODERATION_STATE.HIDDEN });
        expect(canView(owner, row)).toBe(true);
        expect(canView(moderator, row)).toBe(true);
        expect(canView(supporter, row)).toBe(false);
        expect(canView(anonymous, row)).toBe(false);
    });

    test('a removed case is visible to staff only, not even to its owner', () => {
        const row = caseRow({ visibility: VISIBILITY.PUBLIC, moderation_state: MODERATION_STATE.REMOVED });
        expect(canView(moderator, row)).toBe(true);
        expect(canView(owner, row)).toBe(false);
        expect(canView(anonymous, row)).toBe(false);
    });
});

describe('the SQL scope agrees with the row-level rule', () => {
    // If these two ever disagree, a case is either unreachable through the list or —
    // far worse — selectable through it while canView() says no.
    const contexts = [
        ['anonymous', anonymous],
        ['stranger', ctx()],
        ['owner', owner],
        ['community member', member],
        ['participant', participant],
        ['supporter', supporter],
        ['moderator', moderator],
    ];

    const rows = [];
    for (const vis of Object.values(VISIBILITY)) {
        for (const status of [CASE_STATUS.DRAFT, CASE_STATUS.OPEN, CASE_STATUS.RESOLVED]) {
            for (const state of Object.values(MODERATION_STATE)) {
                rows.push(caseRow({
                    visibility: vis,
                    status,
                    moderation_state: state,
                    community_id: vis === VISIBILITY.COMMUNITY ? COMMUNITY : null,
                }));
            }
        }
    }

    test.each(contexts)('%s sees the same cases through both paths', (_label, context) => {
        for (const row of rows) {
            const bySql = matches(scopeWhere(context), row);
            const byRule = canView(context, row);
            expect({ row: describeRow(row), bySql }).toEqual({ row: describeRow(row), bySql: byRule });
        }
    });

    const describeRow = (r) => `${r.visibility}/${r.status}/${r.moderation_state}`;
});

describe('participation rules', () => {
    test('support can only be offered on an open case that is accepting offers', () => {
        const open = caseRow({ visibility: VISIBILITY.PUBLIC });
        const supporterActor = ctx({ actor: { userId: OUTSIDER, roles: [ROLES.SUPPORTER] } });

        expect(visibility.canOfferSupport(supporterActor, open)).toBe(true);
        expect(visibility.canOfferSupport(supporterActor, { ...open, allow_supporter_requests: false })).toBe(false);
        expect(visibility.canOfferSupport(supporterActor, { ...open, status: CASE_STATUS.RESOLVED })).toBe(false);
        // A plain member has no CASE_SUPPORT capability.
        expect(visibility.canOfferSupport(ctx(), open)).toBe(false);
        // Nobody offers support on their own case.
        expect(visibility.canOfferSupport({ ...owner, actor: { userId: OWNER, roles: [ROLES.SUPPORTER] } }, open)).toBe(false);
    });

    test('a public case is not an open comment thread for the whole internet', () => {
        const row = caseRow({ visibility: VISIBILITY.PUBLIC });
        expect(visibility.canComment(anonymous, row)).toBe(false);
        expect(visibility.canComment(ctx(), row)).toBe(false);
        expect(visibility.canComment(participant, row)).toBe(true);
        expect(visibility.canComment(owner, row)).toBe(true);
    });

    test('a locked case admits comments from staff only', () => {
        const row = caseRow({ visibility: VISIBILITY.PUBLIC, is_locked: true });
        expect(visibility.canComment(owner, row)).toBe(false);
        expect(visibility.canComment(participant, row)).toBe(false);
        expect(visibility.canComment(moderator, row)).toBe(true);
    });

    test('only the owner may edit; a moderator acts through moderation actions instead', () => {
        const row = caseRow();
        expect(visibility.canUpdate(owner, row)).toBe(true);
        expect(visibility.canUpdate(moderator, row)).toBe(false);
        expect(visibility.canUpdate(participant, row)).toBe(false);
    });
});
