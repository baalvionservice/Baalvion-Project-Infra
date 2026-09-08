'use strict';
const S = require('../validators/schemas');

describe('case input validation', () => {
    test('a case defaults to PRIVATE and DRAFT when the client says nothing', () => {
        const parsed = S.createCase.parse({ title: 'Need help talking to my parents', summary: 'A short summary.' });
        expect(parsed.visibility).toBe('PRIVATE');
        expect(parsed.status).toBe('DRAFT');
    });

    test('server-controlled fields are stripped rather than accepted', () => {
        // Mass assignment: without this, a create call could set its own moderation state
        // or reassign ownership.
        const parsed = S.createCase.parse({
            title: 'Title', summary: 'Summary',
            moderation_state: 'VISIBLE', owner_id: 'someone-else', supporter_count: 999,
        });
        expect(parsed).not.toHaveProperty('moderation_state');
        expect(parsed).not.toHaveProperty('owner_id');
        expect(parsed).not.toHaveProperty('supporter_count');
    });

    test('an empty title is rejected', () => {
        expect(S.createCase.safeParse({ title: '   ', summary: 'x' }).success).toBe(false);
    });

    test('an unknown visibility level is rejected', () => {
        expect(S.createCase.safeParse({ title: 't', summary: 's', visibility: 'EVERYONE' }).success).toBe(false);
    });

    test('an update with no fields is rejected', () => {
        expect(S.updateCase.safeParse({}).success).toBe(false);
    });
});

describe('participant invitations', () => {
    test('an invitation identifies an existing account and nothing else', () => {
        const parsed = S.inviteParticipant.parse({
            userId: '11111111-1111-4111-8111-111111111111',
            relation: 'PARTNER',
            // A name or contact detail for a non-consenting person must not survive parsing.
            displayName: 'Someone Real', email: 'someone@example.com', phone: '+10000000000',
        });
        expect(parsed).toEqual({ userId: '11111111-1111-4111-8111-111111111111', relation: 'PARTNER' });
    });

    test('SELF cannot be claimed by an invitation', () => {
        expect(S.inviteParticipant.safeParse({
            userId: '11111111-1111-4111-8111-111111111111', relation: 'SELF',
        }).success).toBe(false);
    });
});

describe('moderation input', () => {
    test('a moderation action requires a reason of substance', () => {
        const base = { targetType: 'CASE', targetId: '11111111-1111-4111-8111-111111111111', action: 'HIDE' };
        expect(S.moderationAction.safeParse({ ...base, reason: 'spam' }).success).toBe(false);
        expect(S.moderationAction.safeParse({ ...base, reason: 'Reported for harassment; confirmed.' }).success).toBe(true);
    });

    test('an unrecognised action is rejected at the edge', () => {
        expect(S.moderationAction.safeParse({
            targetType: 'CASE', targetId: '11111111-1111-4111-8111-111111111111',
            action: 'DELETE_EVERYTHING', reason: 'a sufficiently long reason',
        }).success).toBe(false);
    });
});

describe('pagination', () => {
    test('page size is capped so a caller cannot ask for the whole table', () => {
        expect(S.pagination.safeParse({ page: 1, pageSize: 100000 }).success).toBe(false);
    });

    test('string query params are coerced to numbers', () => {
        expect(S.pagination.parse({ page: '2', pageSize: '10' })).toEqual({ page: 2, pageSize: 10 });
    });
});

describe('profile handles', () => {
    test('a handle is constrained to a safe character set', () => {
        expect(S.upsertProfile.safeParse({ handle: 'good_handle-1' }).success).toBe(true);
        expect(S.upsertProfile.safeParse({ handle: 'ab' }).success).toBe(false);
        expect(S.upsertProfile.safeParse({ handle: 'has spaces' }).success).toBe(false);
        expect(S.upsertProfile.safeParse({ handle: '<script>' }).success).toBe(false);
    });
});

describe('reports', () => {
    test('a safety reason is accepted and an invented one is not', () => {
        const base = { targetType: 'CASE', targetId: '11111111-1111-4111-8111-111111111111' };
        expect(S.createReport.safeParse({ ...base, reason: 'THREAT_OR_VIOLENCE' }).success).toBe(true);
        expect(S.createReport.safeParse({ ...base, reason: 'I_DONT_LIKE_IT' }).success).toBe(false);
    });
});
