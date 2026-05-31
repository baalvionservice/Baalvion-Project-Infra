import { describe, it, expect } from 'vitest';
import { evaluate, matches } from '../engine/conditionEvaluator.js';
import { buildContext } from '../engine/attributeResolver.js';
import decisionService from '../services/decisionService.js';

const { candidateKeys, targetMatches } = decisionService;

const ctx = buildContext({
    subject: { id: 'u1', roles: ['organization_admin'], level: 200, orgId: 'org-9', attributes: { department: 'eng', clearance: 3 } },
    resource: { type: 'cms.content', id: 'a1', attributes: { orgId: 'org-9', status: 'draft' } },
    action: 'publish',
    context: { time: '2026-05-31T10:00:00Z' },
    tenant: { id: 't1', type: 'organization', attributes: { region: 'apac' } },
});

describe('conditionEvaluator', () => {
    it('treats empty/null condition as true', () => {
        expect(evaluate({}, ctx)).toBe(true);
        expect(evaluate(null, ctx)).toBe(true);
    });

    it('resolves var paths and equality', () => {
        expect(evaluate({ '==': [{ var: 'subject.orgId' }, { var: 'resource.orgId' }] }, ctx)).toBe(true);
        expect(evaluate({ '==': [{ var: 'subject.orgId' }, 'other'] }, ctx)).toBe(false);
    });

    it('handles numeric comparisons and and/or/not', () => {
        expect(evaluate({ '>=': [{ var: 'subject.clearance' }, 2] }, ctx)).toBe(true);
        expect(evaluate({ and: [{ '>=': [{ var: 'subject.level' }, 200] }, { '==': [{ var: 'action' }, 'publish'] }] }, ctx)).toBe(true);
        expect(evaluate({ or: [{ '==': [{ var: 'action' }, 'delete'] }, { '==': [{ var: 'action' }, 'publish'] }] }, ctx)).toBe(true);
        expect(evaluate({ not: { '==': [{ var: 'subject.department' }, 'sales'] } }, ctx)).toBe(true);
    });

    it('supports in / contains / startsWith / exists', () => {
        expect(evaluate({ in: [{ var: 'subject.department' }, ['eng', 'ops']] }, ctx)).toBe(true);
        expect(evaluate({ in: [{ var: 'tenant.region' }, ['emea']] }, ctx)).toBe(false);
        expect(evaluate({ startsWith: [{ var: 'resource.type' }, 'cms.'] }, ctx)).toBe(true);
        expect(evaluate({ exists: { var: 'subject.department' } }, ctx)).toBe(true);
        expect(evaluate({ exists: { var: 'subject.missing' } }, ctx)).toBe(false);
    });

    it('matches() returns false (never throws) on malformed conditions', () => {
        expect(matches({ bogusOp: [1, 2] }, ctx)).toBe(false);
    });

    it('env hour is derived from context time', () => {
        expect(ctx.env.hour).toBe(10);
    });

    it('region-restriction example: finance_manager can only see own region', () => {
        // RBAC gives the broad grant; this ABAC condition narrows it to own region.
        const condition = { '==': [{ var: 'resource.region' }, { var: 'subject.region' }] };
        const inRegion = buildContext({ subject: { id: 'fm', region: 'apac' }, resource: { type: 'finance.record', region: 'apac' } });
        const crossRegion = buildContext({ subject: { id: 'fm', region: 'apac' }, resource: { type: 'finance.record', region: 'emea' } });
        expect(evaluate(condition, inRegion)).toBe(true);
        expect(evaluate(condition, crossRegion)).toBe(false);
    });
});

describe('decision helpers', () => {
    it('candidateKeys includes exact + wildcard forms', () => {
        expect(candidateKeys('cms.content', 'publish')).toEqual(['cms.content:publish', 'cms.content:*', '*:publish', '*:*']);
    });

    it('targetMatches honors empty target (applies to all) and filters', () => {
        const base = { action: 'publish', resourceType: 'cms.content', roles: ['organization_admin'], scopeType: 'organization', scopeId: 'org-9' };
        expect(targetMatches({}, base)).toBe(true);
        expect(targetMatches({ actions: ['publish'] }, base)).toBe(true);
        expect(targetMatches({ actions: ['delete'] }, base)).toBe(false);
        expect(targetMatches({ roles: ['super_admin'] }, base)).toBe(false);
        expect(targetMatches({ resources: ['cms.content'], roles: ['organization_admin'] }, base)).toBe(true);
    });
});
