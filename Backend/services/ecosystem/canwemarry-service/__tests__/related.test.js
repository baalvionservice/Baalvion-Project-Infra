'use strict';
/**
 * Related discovery.
 *
 * A "you might also look at" list is the easiest place in a product like this to leak,
 * because it returns rows the caller never asked for. Two properties are therefore worth
 * asserting directly rather than trusting: that related cases are read through the SAME
 * visibility predicate as the main listing, and that the response never says why anything
 * was chosen — the connection between two cases is itself a fact about both of them.
 */
process.env.JWT_PUBLIC_KEY = 'test-public-key';
process.env.NODE_ENV = 'test';

const visibility = require('../domain/visibility');

const OPEN_CASE = {
    id: 'case-1', reference: 'CWM-AAA001', owner_id: 'u-owner', community_id: 'c-1',
    title: 'A case', summary: 'A summary', situation: 'The detail',
    support_needed: ['LEGAL', 'MEDIATION'], visibility: 'PUBLIC', status: 'OPEN',
    moderation_state: 'VISIBLE', country_code: 'IN', is_locked: false,
    supporter_count: 0, comment_count: 0, created_at: new Date('2026-03-01'),
};
const PRIVATE_CASE = { ...OPEN_CASE, id: 'case-private', visibility: 'PRIVATE', owner_id: 'u-someone-else' };

let caseFindAllArgs = null;

jest.mock('../models', () => {
    const { Op } = require('sequelize');
    return {
        Op,
        sequelize: {
            literal: jest.fn((sql) => ({ __literal: sql })),
            escape: jest.fn((v) => `'${v}'`),
            fn: jest.fn((...a) => ({ fn: a })),
            col: jest.fn((c) => ({ col: c })),
        },
        Case: {
            findByPk: jest.fn(async (id) => global.__cases[id] || null),
            findAll: jest.fn(async (args) => { global.__caseArgs = args; return global.__relatedCases; }),
        },
        Resource: { findAll: jest.fn(async (args) => { global.__resourceArgs = args; return global.__resources; }) },
        Community: { findAll: jest.fn(async (args) => { global.__communityArgs = args; return global.__communities; }) },
        CommunityMember: { findAll: jest.fn(async () => []) },
        Post: { findAll: jest.fn(async () => []) },
    };
});

const relatedService = require('../service/relatedService');


/**
 * Render a Sequelize `where` as text, INCLUDING its Symbol keys.
 *
 * JSON.stringify silently drops Symbol-keyed properties, so a predicate built from Op.and /
 * Op.or serialises to "{}" and every assertion against it passes vacuously. Walking with
 * Reflect.ownKeys is the difference between checking the query and checking nothing.
 */
function describeWhere(value) {
    if (value === null || typeof value !== 'object') return String(value);
    if (Array.isArray(value)) return `[${value.map(describeWhere).join(',')}]`;
    return `{${Reflect.ownKeys(value).map((k) => `${String(k)}:${describeWhere(value[k])}`).join(',')}}`;
}

const ctxFor = (userId, communityIds = []) => ({
    actor: { userId, roles: userId ? ['USER'] : [] },
    communityIds,
    membershipByCommunity: {},
    participantCaseIds: [],
    supporterCaseIds: [],
});

beforeEach(() => {
    global.__cases = { 'case-1': OPEN_CASE, 'case-private': PRIVATE_CASE };
    global.__relatedCases = [];
    global.__resources = [];
    global.__communities = [];
    global.__caseArgs = null;
    global.__resourceArgs = null;
    global.__communityArgs = null;
    caseFindAllArgs = null;
});

describe('the case itself is re-checked before anything related is returned', () => {
    test('a case the caller may not see answers 404', async () => {
        await expect(relatedService.forCase(ctxFor('u-stranger'), 'case-private'))
            .rejects.toMatchObject({ statusCode: 404 });
    });

    test('a missing case answers the same 404', async () => {
        // Same answer for "not allowed" and "not there", so this cannot be used to confirm
        // that a private case exists.
        await expect(relatedService.forCase(ctxFor('u-stranger'), 'case-nope'))
            .rejects.toMatchObject({ statusCode: 404 });
    });

    test('an anonymous visitor can read related items for a public case', async () => {
        const out = await relatedService.forCase(ctxFor(null), 'case-1');
        expect(out).toHaveProperty('resources');
        expect(out).toHaveProperty('communities');
        expect(out).toHaveProperty('cases');
    });
});

describe('related cases go through the real visibility predicate', () => {
    test('the query contains exactly what scopeWhere produced for this caller', async () => {
        const ctx = ctxFor('u-reader', ['c-9']);
        await relatedService.forCase(ctx, 'case-1');

        // The real predicate, rendered the same way — so this proves the SAME rule was used
        // rather than a second one that happens to look similar today.
        const expected = describeWhere(visibility.scopeWhere(ctx));
        expect(describeWhere(global.__caseArgs.where)).toContain(expected);
    });

    test('and that comparison is not vacuous', () => {
        // scopeWhere must actually produce something with Symbol keys, or the assertion
        // above would be comparing two empty strings and passing for no reason.
        const rendered = describeWhere(visibility.scopeWhere(ctxFor('u-reader', ['c-9'])));
        expect(rendered.length).toBeGreaterThan(20);
        expect(rendered).toContain('Symbol(');
    });

    test('drafts are never related to anything', async () => {
        await relatedService.forCase(ctxFor('u-reader'), 'case-1');
        const flat = describeWhere(global.__caseArgs.where);
        expect(flat).toContain('DRAFT');
    });

    test('the case never relates to itself', async () => {
        await relatedService.forCase(ctxFor('u-reader'), 'case-1');
        const flat = describeWhere(global.__caseArgs.where);
        expect(flat).toContain('case-1');
    });

    test('a case with no country and no asked-for support relates to no cases at all', async () => {
        // Rather than falling back to "anything recent", which would turn this into an
        // unfiltered listing of other people's situations.
        global.__cases['case-bare'] = { ...OPEN_CASE, id: 'case-bare', country_code: null, support_needed: [] };
        const out = await relatedService.forCase(ctxFor('u-reader'), 'case-bare');
        expect(out.cases).toEqual([]);
    });
});

describe('the response never explains a match', () => {
    test('no reason, score or match field appears anywhere', async () => {
        global.__resources = [{
            id: 'r-1', slug: 'legal-help', title: 'Legal help', summary: 'Summary',
            category: 'LEGAL', country_code: 'IN', provider_name: 'A provider', url: null,
        }];
        const out = await relatedService.forCase(ctxFor(null), 'case-1');
        const json = JSON.stringify(out);
        // Why two cases sit next to each other is a fact about both of them, and not one
        // either owner agreed to publish.
        expect(json).not.toMatch(/"(reason|matchedOn|score|similarity|because)"/i);
    });

    test('a related resource is a card, not the whole article', async () => {
        global.__resources = [{
            id: 'r-1', slug: 'legal-help', title: 'Legal help', summary: 'Summary',
            body: 'THE ENTIRE ARTICLE BODY', category: 'LEGAL', country_code: 'IN',
            provider_name: 'A provider', url: null,
        }];
        const out = await relatedService.forCase(ctxFor(null), 'case-1');
        expect(out.resources[0]).not.toHaveProperty('body');
        expect(JSON.stringify(out)).not.toContain('THE ENTIRE ARTICLE BODY');
    });
});

describe('related communities follow the community visibility rule', () => {
    test('a stranger’s query asks only for public communities', async () => {
        await relatedService.forCase(ctxFor(null), 'case-1');
        const flat = describeWhere(global.__communityArgs.where);
        expect(flat).toContain('PUBLIC');
    });

    test('a member’s query additionally names the communities they are in', async () => {
        await relatedService.forCase(ctxFor('u-member', ['c-secret']), 'case-1');
        const flat = describeWhere(global.__communityArgs.where);
        expect(flat).toContain('c-secret');
    });

    test('the case’s own community is excluded — the page already shows it', async () => {
        await relatedService.forCase(ctxFor(null), 'case-1');
        const flat = describeWhere(global.__communityArgs.where);
        expect(flat).toContain('c-1');
    });
});

describe('resource matching is coarse on purpose', () => {
    test('safety guidance is offered on every case, whatever was asked for', () => {
        // Somebody who did not think to ask for it is precisely who most needs to see it.
        expect(relatedService.categoriesFor([])).toContain('SAFETY');
        expect(relatedService.categoriesFor(['LEGAL'])).toContain('SAFETY');
    });

    test('asking for legal help offers legal and rights material', () => {
        const out = relatedService.categoriesFor(['LEGAL']);
        expect(out).toEqual(expect.arrayContaining(['LEGAL', 'RIGHTS']));
    });

    test('an unknown need does not throw or widen the categories', () => {
        expect(relatedService.categoriesFor(['NOT_A_REAL_NEED'])).toEqual(['SAFETY']);
    });
});
