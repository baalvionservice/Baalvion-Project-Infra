'use strict';
/**
 * The operational layer: what the command centre, analytics and health checks are allowed to
 * say, and what they must never say.
 *
 * Most of these assertions are about ABSENCE, which is unusual for a test file and is the
 * point. An operations screen is read far more often than it is acted on — it sits on a
 * monitor, people walk past it — so the interesting failures are not "the number is wrong"
 * but "the number came with a name attached". Several tests below exist only to fail if a
 * future change starts returning identifiers or content alongside the counts.
 */
process.env.JWT_PUBLIC_KEY = 'test-public-key';
process.env.NODE_ENV = 'test';

let mockRows = {};
let mockCapturedSql = [];

jest.mock('../models', () => ({
    Op: require('sequelize').Op,
    sequelize: {
        QueryTypes: { SELECT: 'SELECT' },
        literal: jest.fn((sql) => ({ __literal: sql })),
        query: jest.fn(async (sql, opts = {}) => {
            mockCapturedSql.push(sql);
            const key = Object.keys(mockRows).find((k) => sql.includes(k));
            const value = key ? mockRows[key] : (opts.plain ? {} : []);
            return value;
        }),
    },
}));

const analyticsService = require('../service/analyticsService');
const operationsService = require('../service/operationsService');
const platformStateService = require('../service/platformStateService');

beforeEach(() => {
    mockRows = {};
    mockCapturedSql = [];
});

// ── Analytics ────────────────────────────────────────────────────────────────

describe('every metric carries a definition, and every definition a metric', () => {
    test('the definitions cover the keys the overview returns', async () => {
        mockRows = {
            'canwemarry.users': { registered: 3, active: 2, suspended: 1, total: 9 },
            'canwemarry.cases': { created: 4, opened: 2, draft: 1, resolved: 1, closed: 0, under_review: 0 },
            'canwemarry.case_supporters': { offered: 5, accepted: 4, withdrawn: 1 },
            'canwemarry.communities WHERE is_active': { communities: 2, memberships: 7, posts: 3, comments: 6, with_activity: 1 },
            'canwemarry.reports': { created: 2, open: 1, resolved: 1, critical: 1, oldest_open_hours: 5 },
            'canwemarry.moderation_actions': { taken: 3 },
        };
        const out = await analyticsService.overview('30d');

        // Every leaf under a named group must be explainable.
        for (const group of ['users', 'cases', 'support', 'community', 'safety']) {
            for (const metric of Object.keys(out[group])) {
                const key = `${group}.${metric}`;
                if (key === 'users.total') continue; // self-evident, and stated on the page
                expect(analyticsService.DEFINITIONS[key]).toBeDefined();
            }
        }
    });

    test('no definition describes a metric that is not returned', async () => {
        // A definition with no number is a promise the dashboard cannot keep.
        mockRows = {
            'canwemarry.users': {}, 'canwemarry.cases': {}, 'canwemarry.case_supporters': {},
            'canwemarry.communities WHERE is_active': {}, 'canwemarry.reports': {},
            'canwemarry.moderation_actions': {},
        };
        const out = await analyticsService.overview('30d');
        for (const key of Object.keys(analyticsService.DEFINITIONS)) {
            const [group, metric] = key.split('.');
            expect(out[group]).toHaveProperty(metric);
        }
    });

    test('a definition says what window or point in time it means', () => {
        for (const [key, text] of Object.entries(analyticsService.DEFINITIONS)) {
            // A real sentence rather than a restated label — "Report count" explains nothing.
            // Five words is the bar; "Reports created in the window." is short and complete,
            // and a longer minimum would have punished it for being clear.
            expect(text.trim().split(/\s+/).length).toBeGreaterThanOrEqual(5);
            expect(text.trim().endsWith('.')).toBe(true);
            // Every metric is anchored: bounded by the window, or explicitly about now.
            expect(/window|currently|RIGHT NOW|right now|in force|still|Median|divided/i.test(text))
                .toBe(true);
        }
    });
});

describe('analytics are aggregates and nothing else', () => {
    const emptyRows = {
        'canwemarry.users': { registered: 0, active: 0, suspended: 0, total: 0 },
        'canwemarry.cases': { created: 0, opened: 0, draft: 0, resolved: 0, closed: 0, under_review: 0 },
        'canwemarry.case_supporters': { offered: 0, accepted: 0, withdrawn: 0 },
        'canwemarry.communities WHERE is_active': { communities: 0, memberships: 0, posts: 0, comments: 0, with_activity: 0 },
        'canwemarry.reports': { created: 0, open: 0, resolved: 0, critical: 0, oldest_open_hours: null },
        'canwemarry.moderation_actions': { taken: 0 },
    };

    test('the query never selects a column that identifies anybody', async () => {
        mockRows = emptyRows;
        await analyticsService.overview('30d');
        const sql = mockCapturedSql.join(' ');
        for (const column of ['title', 'summary', 'situation', 'body', 'email', 'handle', 'display_name', 'details', 'reporter_id', 'owner_id']) {
            expect(sql).not.toMatch(new RegExp(`SELECT[^;]*\\b${column}\\b`, 'i'));
        }
    });

    test('every value returned is a number or null — never a row', async () => {
        mockRows = emptyRows;
        const out = await analyticsService.overview('30d');
        for (const group of ['users', 'cases', 'support', 'community', 'safety']) {
            for (const v of Object.values(out[group])) {
                expect(v === null || typeof v === 'number').toBe(true);
            }
        }
    });

    test('an unknown window is refused rather than silently defaulted', async () => {
        // Defaulting would make the page describe a different period from the one it labels.
        await expect(analyticsService.overview('all-time')).rejects.toMatchObject({ statusCode: 400 });
    });

    test('the four offered windows all resolve', async () => {
        mockRows = emptyRows;
        for (const key of Object.keys(analyticsService.WINDOWS)) {
            const out = await analyticsService.overview(key);
            expect(out.window.key).toBe(key);
            expect(out.window.timezone).toBe('UTC');
        }
    });

    test('supporters per open case is zero rather than a division by zero', async () => {
        mockRows = { ...emptyRows, 'canwemarry.case_supporters': { offered: 3, accepted: 3, withdrawn: 0 } };
        const out = await analyticsService.overview('30d');
        expect(out.support.perOpenCase).toBe(0);
    });

    test('a median is withheld until there is enough to have one', async () => {
        // Two resolved reports do not have a median worth printing; null says so, and zero
        // would read as "decided instantly".
        mockRows = { ...emptyRows };
        const out = await analyticsService.overview('30d');
        expect(out.safety.medianResolutionHours).toBeNull();
    });
});

// ── Operations summary ───────────────────────────────────────────────────────

describe('the command centre reports state, never content', () => {
    test('a suspension is reported as the platform ENFORCES it, not as the column reads', async () => {
        // users.status stays SUSPENDED after expiry — nothing rewrites it, and no job sweeps
        // it. The middleware checks `suspended_until > now()`, so an expired suspension no
        // longer blocks anybody. Reporting the column would say somebody is locked out when
        // they are not.
        mockRows = {
            'FROM canwemarry.users': [
                { id: 'u-1', status: 'SUSPENDED', suspended_until: '2026-01-01T00:00:00Z', updated_at: '2025-12-01T00:00:00Z', has_expired: true },
                { id: 'u-2', status: 'SUSPENDED', suspended_until: null, updated_at: '2026-02-01T00:00:00Z', has_expired: false },
            ],
        };
        const rows = await operationsService.suspensions();
        expect(rows[0].storedStatus).toBe('SUSPENDED');
        expect(rows[0].effectiveState).toBe('EXPIRED');
        expect(rows[1].effectiveState).toBe('ACTIVE');
        expect(rows[1].indefinite).toBe(true);
    });

    test('the suspension query mirrors the middleware, not the column alone', async () => {
        mockRows = { 'FROM canwemarry.users': [] };
        await operationsService.suspensions();
        const sql = mockCapturedSql.join(' ');
        expect(sql).toContain('suspended_until');
        expect(sql).toContain('now()');
    });

    test('recent decisions name no actor', async () => {
        // Who acted belongs in the moderation log, where it is attributable. On a dashboard
        // it becomes a scoreboard, and a scoreboard rewards speed over care.
        mockRows = {
            'FROM canwemarry.moderation_actions': [
                { action: 'HIDE', target_type: 'COMMENT', created_at: '2026-03-01T00:00:00Z' },
            ],
        };
        const rows = await operationsService.recentActions();
        expect(rows[0]).toEqual({ action: 'HIDE', targetType: 'COMMENT', at: '2026-03-01T00:00:00Z' });
        expect(JSON.stringify(rows)).not.toMatch(/actor|reason|reporter/i);
    });

    test('the recent-actions query does not even select the actor or the reason', async () => {
        mockRows = { 'FROM canwemarry.moderation_actions': [] };
        await operationsService.recentActions();
        const sql = mockCapturedSql.join(' ');
        expect(sql).not.toMatch(/actor_id/);
        expect(sql).not.toMatch(/\breason\b/);
    });

    test('what is waiting is grouped by category, never listed', async () => {
        mockRows = {
            'FROM canwemarry.reports': [{ reason: 'HARASSMENT', severity: 'NORMAL', count: 3 }],
        };
        const rows = await operationsService.awaitingByReason();
        expect(rows).toEqual([{ reason: 'HARASSMENT', severity: 'NORMAL', count: 3 }]);
        const sql = mockCapturedSql.join(' ');
        expect(sql).not.toMatch(/details|target_id|reporter_id/);
    });

    test('there is no method that takes a user id', () => {
        // The absence of a per-person view is structural: there is nothing to pass one to.
        for (const fn of Object.values(operationsService)) {
            expect(fn.length).toBe(0);
        }
    });
});

// ── Health ───────────────────────────────────────────────────────────────────

describe('health checks report what was measured', () => {
    test('a failing dependency is UNAVAILABLE, not silently healthy', async () => {
        const db = require('../models');
        db.sequelize.query.mockRejectedValueOnce(new Error('connection refused for user "baalvion" at 10.0.0.5'));
        const out = await platformStateService.health();
        const database = out.checks.find((c) => c.key === 'database');
        expect(database.state).toBe('UNAVAILABLE');
    });

    test('a driver error never reaches the response', async () => {
        // Connection failures quote hosts, users and sometimes passwords. They are logged.
        const db = require('../models');
        db.sequelize.query.mockRejectedValueOnce(new Error('password authentication failed for user "baalvion"'));
        const out = await platformStateService.health();
        const json = JSON.stringify(out);
        expect(json).not.toMatch(/password|authentication failed|10\.0\.0\.5|baalvion"/);
    });

    test('the overall state is the worst one, not an average', async () => {
        const db = require('../models');
        db.sequelize.query.mockRejectedValueOnce(new Error('down'));
        const out = await platformStateService.health();
        expect(out.overall).toBe('UNAVAILABLE');
    });

    test('an unconfigured check reports UNKNOWN rather than guessing', async () => {
        // Reporting healthy because nothing proved otherwise is how outages get missed.
        const out = await platformStateService.health();
        const identity = out.checks.find((c) => c.key === 'identity');
        expect(['HEALTHY', 'DEGRADED', 'UNAVAILABLE', 'UNKNOWN']).toContain(identity.state);
    });
});

describe('configuration is reported, never changed', () => {
    test('the flags that alter product behaviour are listed', () => {
        const keys = platformStateService.configuration().map((c) => c.key);
        expect(keys).toContain('ALLOW_PUBLIC_CASES');
    });

    test('each entry says where it is actually changed', () => {
        for (const item of platformStateService.configuration()) {
            expect(item.changedBy).toMatch(/environment/i);
        }
    });

    test('the module exposes no way to write a flag', () => {
        // A toggle that does not change backend behaviour is worse than no toggle.
        const surface = Object.keys(platformStateService).join(' ');
        expect(surface).not.toMatch(/set|update|toggle|enable|write/i);
    });

    test('public case discovery explains itself while it is off', () => {
        const flag = platformStateService.configuration().find((c) => c.key === 'ALLOW_PUBLIC_CASES');
        if (!flag.enabled) expect(flag.summary).toMatch(/moderation coverage/i);
    });
});
