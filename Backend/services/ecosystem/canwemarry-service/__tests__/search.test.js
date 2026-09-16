'use strict';
/**
 * Case search and sort.
 *
 * The point of these assertions is that search is composed INTO the visibility predicate
 * rather than applied to its results. A search that could reach outside the scope would let
 * someone confirm a private case exists by probing for words they expect to be in it.
 */
const { Op } = require('sequelize');

const captured = {};
jest.mock('../models', () => {
    const { Op: SequelizeOp } = require('sequelize');
    return {
        Op: SequelizeOp,
        sequelize: { transaction: jest.fn(), literal: jest.fn(), fn: jest.fn(), col: jest.fn() },
        Case: {
            findAndCountAll: jest.fn(async (args) => { Object.assign(captured, args); return { rows: [], count: 0 }; }),
            count: jest.fn(async () => 0),
        },
        CommunityMember: { findOne: jest.fn(async () => null) },
        CaseParticipant: { create: jest.fn() },
        Comment: { destroy: jest.fn() },
    };
});

const caseService = require('../service/caseService');
const { ROLES } = require('../domain/roles');

const ctx = (over = {}) => ({
    actor: { userId: 'u1', roles: [ROLES.USER] },
    communityIds: [],
    participantCaseIds: [],
    supporterCaseIds: [],
    ...over,
});

/** Recursively collect every clause in the composed where tree. */
function flatten(where, out = []) {
    if (!where || typeof where !== 'object') return out;
    out.push(where);
    for (const key of Reflect.ownKeys(where)) {
        const value = where[key];
        if (Array.isArray(value)) value.forEach((v) => flatten(v, out));
    }
    return out;
}

beforeEach(() => { for (const k of Object.keys(captured)) delete captured[k]; });

describe('search', () => {
    test('the term is ANDed alongside the visibility scope, not applied afterwards', async () => {
        await caseService.list(ctx(), { page: 1, pageSize: 10, q: 'parents' });

        const clauses = flatten(captured.where);
        // The scope's own marker: private cases are only reachable through an owner /
        // participant / community branch, which lives under the same Op.and.
        const hasSearch = clauses.some((c) => c.title && c.title[Op.iLike]);
        const hasScope = clauses.some((c) => c.moderation_state || c.owner_id || c.visibility);
        expect(hasSearch).toBe(true);
        expect(hasScope).toBe(true);
        expect(Reflect.ownKeys(captured.where)).toContain(Op.and);
    });

    test('LIKE metacharacters in the term are escaped', async () => {
        // Without escaping, a term of '%' matches every row and turns search into a way to
        // enumerate whatever the scope allows.
        await caseService.list(ctx(), { page: 1, pageSize: 10, q: '100%_off' });
        const clause = flatten(captured.where).find((c) => c.title && c.title[Op.iLike]);
        expect(clause.title[Op.iLike]).toBe('%100\\%\\_off%');
    });

    test('an absent term adds no search clause at all', async () => {
        await caseService.list(ctx(), { page: 1, pageSize: 10 });
        expect(flatten(captured.where).some((c) => c.title)).toBe(false);
    });
});

describe('sort', () => {
    test('recent is the default ordering', async () => {
        await caseService.list(ctx(), { page: 1, pageSize: 10 });
        expect(captured.order).toEqual([['created_at', 'DESC']]);
    });

    test('a known sort key is honoured', async () => {
        await caseService.list(ctx(), { page: 1, pageSize: 10, sort: 'supported' });
        expect(captured.order).toEqual([['supporter_count', 'DESC'], ['created_at', 'DESC']]);
    });

    test('an unknown key falls back to recent rather than reaching the database', async () => {
        // The Zod schema rejects these at the edge; this is the second line, so a caller
        // reaching the service directly cannot inject an ORDER BY.
        await caseService.list(ctx(), { page: 1, pageSize: 10, sort: 'created_at; DROP TABLE cases' });
        expect(captured.order).toEqual([['created_at', 'DESC']]);
    });
});

describe('filters', () => {
    test('a support-need facet becomes an array containment check', async () => {
        await caseService.list(ctx(), { page: 1, pageSize: 10, supportNeeded: 'MEDIATION' });
        const clause = flatten(captured.where).find((c) => c.support_needed);
        expect(clause.support_needed[Op.contains]).toEqual(['MEDIATION']);
    });
});
