'use strict';
/**
 * Sanctions list alerting — verification harness.
 *
 * Without a database: the alert wording, dedupe, failure paths.
 * With SANCTIONS_TEST_DB set (a throwaway Postgres with migrations 014 and 088): the real
 * freshness queries — a stale list alerts, a fresh one does not, and the heartbeat is
 * only sent when everything is fresh.
 *
 *   node tests/sanctions-list-alerts.verify.js
 */
const assert = require('assert');
const alerts = require('../service/compliance/lists/alerts');
const ntfy = require('../service/compliance/lists/ntfy');

let pass = 0;
let fail = 0;
async function t(name, fn) {
    try { alerts._reset(); await fn(); pass += 1; console.log(`  ✓ ${name}`); } catch (e) { fail += 1; console.log(`  ✗ ${name}\n      ${e.message}`); }
}

const fake = () => {
    const sent = [];
    const beats = [];
    return { sent, beats, lib: { sendNtfy: async (m) => { sent.push(m); return { sent: true }; }, sendHeartbeat: async (u) => { beats.push(u); return { sent: true }; } } };
};

(async () => {
    console.log('Failure alerts');
    await t('a failed or refused list alerts as critical and names the list, not secrets', async () => {
        const f = fake();
        await alerts.alertRefreshFailure([
            { source: 'OFAC', status: 'refused', error: 'would shrink the active list from 19416 to 9000' },
            { source: 'UN', status: 'succeeded' },
            { source: 'EU', status: 'failed', error: 'HTTP 503' },
        ], { ntfy: f.lib });
        assert.strictEqual(f.sent.length, 1);
        assert.strictEqual(f.sent[0].severity, 'critical');
        assert.match(f.sent[0].body, /OFAC: refused/);
        assert.match(f.sent[0].body, /EU: failed/);
        assert.doesNotMatch(f.sent[0].body, /UN:/);
    });
    await t('download URLs (one carries an access token) never appear in an alert', async () => {
        const f = fake();
        await alerts.alertRefreshFailure([{ source: 'EU', status: 'failed', error: 'HTTP 503 from https://webgate.ec.europa.eu/fsd/x/content?token=SECRETVALUE' }], { ntfy: f.lib });
        assert.doesNotMatch(f.sent[0].body, /SECRETVALUE|https?:/);
        assert.match(f.sent[0].body, /HTTP 503 from \[url\]/);
    });
    await t('no failures means no alert', async () => {
        const f = fake();
        const r = await alerts.alertRefreshFailure([{ source: 'OFAC', status: 'succeeded' }, { source: 'UN', status: 'unchanged' }], { ntfy: f.lib });
        assert.strictEqual(f.sent.length, 0);
        assert.strictEqual(r.sent, false);
    });
    await t('an unavailable alert channel never throws', async () => {
        const r = await alerts.alertRefreshFailure([{ source: 'OFAC', status: 'failed', error: 'x' }], { ntfy: null });
        assert.strictEqual(r.sent, false);
    });

    console.log('\nntfy sender');
    await t('does nothing, without error, when no topic is configured', async () => {
        let called = false;
        const r = await ntfy.sendNtfy({ title: 'x', body: 'y' }, { env: {}, fetchImpl: async () => { called = true; } });
        assert.strictEqual(r.sent, false);
        assert.strictEqual(called, false);
    });
    await t('posts to the topic with title, priority and token', async () => {
        let seen;
        const r = await ntfy.sendNtfy({ title: 'Stale', body: 'b', severity: 'critical', tags: ['warning'] },
            { env: { NTFY_TOPIC: 'my topic', NTFY_SERVER: 'https://ntfy.example/', NTFY_TOKEN: 't0k' }, fetchImpl: async (u, o) => { seen = { u, o }; return { ok: true }; } });
        assert.strictEqual(r.sent, true);
        assert.strictEqual(seen.u, 'https://ntfy.example/my%20topic');
        assert.strictEqual(seen.o.headers.Priority, '5');
        assert.strictEqual(seen.o.headers.Title, 'Stale');
        assert.strictEqual(seen.o.headers.Authorization, 'Bearer t0k');
    });
    await t('a network error or non-200 is reported, never thrown', async () => {
        const down = await ntfy.sendNtfy({ title: 'x' }, { env: { NTFY_TOPIC: 'a' }, fetchImpl: async () => { throw new Error('ECONNRESET'); } });
        assert.strictEqual(down.sent, false);
        const bad = await ntfy.sendNtfy({ title: 'x' }, { env: { NTFY_TOPIC: 'a' }, fetchImpl: async () => ({ ok: false, status: 429 }) });
        assert.match(bad.error, /429/);
        assert.strictEqual((await ntfy.sendHeartbeat('https://hb', { fetchImpl: async () => ({ ok: true }) })).sent, true);
        assert.strictEqual((await ntfy.sendHeartbeat(null)).sent, false);
    });

    console.log('\nDedupe');
    await t('a standing problem alerts once per window, not every check', () => {
        const t0 = 1_000_000_000_000;
        assert.strictEqual(alerts.shouldAlert('stale:OFAC', t0), true);
        assert.strictEqual(alerts.shouldAlert('stale:OFAC', t0 + 3600_000), false);
        assert.strictEqual(alerts.shouldAlert('stale:UN', t0 + 3600_000), true);
        assert.strictEqual(alerts.shouldAlert('stale:OFAC', t0 + 13 * 3600_000), true);
    });

    console.log('\nWatchdog without a readable status');
    await t('if the import log cannot be read, it says so instead of staying silent', async () => {
        const f = fake();
        const broken = { query: async () => { throw new Error('relation does not exist'); } };
        const r = await alerts.checkFreshness(broken, { ntfy: f.lib });
        assert.strictEqual(r.ok, false);
        assert.strictEqual(f.sent.length, 1);
        assert.match(f.sent[0].title, /cannot read/);
        assert.strictEqual(f.beats.length, 0);
    });

    if (process.env.SANCTIONS_TEST_DB) {
        console.log('\nFreshness against real Postgres');
        const { Sequelize } = require('sequelize');
        const sequelize = new Sequelize(process.env.SANCTIONS_TEST_DB, { logging: false });
        const reset = async () => {
            await sequelize.query('DELETE FROM tradeops.compliance_list_imports');
            await sequelize.query("DELETE FROM tradeops.compliance_sanctioned_parties WHERE source_id IS NOT NULL");
        };
        const win = (source, hoursAgo, status = 'succeeded') => sequelize.query(
            `INSERT INTO tradeops.compliance_list_imports (list_source, status, records_parsed, started_at, finished_at)
             VALUES (:source, :status, 10, now() - (:h || ' hours')::interval, now())`,
            { replacements: { source, status, h: String(hoursAgo) } },
        );
        try {
            await t('a list never imported is stale and alerts; the heartbeat is NOT sent', async () => {
                await reset();
                const f = fake();
                const r = await alerts.checkFreshness(sequelize, { ntfy: f.lib, heartbeatUrl: 'https://hb.example/x' });
                assert.deepStrictEqual(r.stale.sort(), ['EU', 'OFAC', 'UN']);
                assert.strictEqual(f.sent.length, 3);
                assert.match(f.sent[0].body, /never been imported/);
                assert.strictEqual(f.beats.length, 0);
            });
            await t('all lists fresh: no alert, heartbeat sent', async () => {
                await reset();
                await win('OFAC', 2); await win('UN', 5, 'unchanged'); await win('EU', 1);
                const f = fake();
                const r = await alerts.checkFreshness(sequelize, { ntfy: f.lib, heartbeatUrl: 'https://hb.example/x' });
                assert.deepStrictEqual(r.stale, []);
                assert.strictEqual(f.sent.length, 0);
                assert.deepStrictEqual(f.beats, ['https://hb.example/x']);
            });
            await t('one list older than the limit alerts for that list only', async () => {
                await reset();
                await win('OFAC', 2); await win('UN', 30); await win('EU', 1);
                const f = fake();
                const r = await alerts.checkFreshness(sequelize, { ntfy: f.lib });
                assert.deepStrictEqual(r.stale, ['UN']);
                assert.strictEqual(f.sent.length, 1);
                assert.match(f.sent[0].title, /UN/);
                assert.strictEqual(f.beats.length, 0);
            });
            await t('a refused attempt after an old success does not make the list look fresh', async () => {
                await reset();
                await win('OFAC', 40); await win('OFAC', 1, 'refused'); await win('UN', 1); await win('EU', 1);
                const f = fake();
                const r = await alerts.checkFreshness(sequelize, { ntfy: f.lib });
                assert.deepStrictEqual(r.stale, ['OFAC']);
                const s = r.status.find((x) => x.list === 'OFAC');
                assert.strictEqual(s.last_attempt.status, 'refused');
            });
            await t('SANCTIONS_MAX_AGE_HOURS tunes the limit', async () => {
                await reset();
                await win('OFAC', 5); await win('UN', 5); await win('EU', 5);
                const f = fake();
                const r = await alerts.checkFreshness(sequelize, { ntfy: f.lib, env: { SANCTIONS_MAX_AGE_HOURS: '4' } });
                assert.strictEqual(r.stale.length, 3);
            });
        } finally {
            await sequelize.close();
        }
    } else {
        console.log('\n(real-database freshness tests skipped — set SANCTIONS_TEST_DB to run them)');
    }

    console.log(`\n${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
})();
