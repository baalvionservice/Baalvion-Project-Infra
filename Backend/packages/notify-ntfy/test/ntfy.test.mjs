import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require_ = createRequire(import.meta.url);
const { sendNtfy, sendHeartbeat, isConfigured, resolveConfig, PRIORITY } = require_('../index.js');

// The alerting path must never throw and never block. Every test here asserts that an outage in
// the alerting channel itself degrades to a reported failure rather than taking down the caller —
// the prober that calls this is the last thing that should die during an incident.

const withEnv = async (vars, fn) => {
    const saved = {};
    for (const [k, v] of Object.entries(vars)) {
        saved[k] = process.env[k];
        if (v === undefined) delete process.env[k]; else process.env[k] = v;
    }
    try { return await fn(); } finally {
        for (const [k, v] of Object.entries(saved)) {
            if (v === undefined) delete process.env[k]; else process.env[k] = v;
        }
    }
};

test('an unset topic is reported as skipped, not thrown', async () => {
    await withEnv({ NTFY_TOPIC: undefined }, async () => {
        assert.equal(isConfigured(), false);
        const r = await sendNtfy({ title: 'x', body: 'y' });
        assert.equal(r.sent, false);
        assert.match(r.skipped, /NTFY_TOPIC/);
    });
});

test('an unreachable server is reported as an error, not thrown', async () => {
    await withEnv({ NTFY_TOPIC: 't', NTFY_SERVER: 'https://ntfy-does-not-exist.invalid' }, async () => {
        const r = await sendNtfy({ title: 'x' }, { timeoutMs: 2000 });
        assert.equal(r.sent, false);
        assert.ok(r.error);
    });
});

test('a missing heartbeat URL is skipped rather than failing the sweep', async () => {
    await withEnv({ STATUS_HEARTBEAT_URL: undefined }, async () => {
        const r = await sendHeartbeat();
        assert.equal(r.sent, false);
        assert.match(r.skipped, /STATUS_HEARTBEAT_URL/);
    });
});

test('severity maps onto ntfy priorities, with critical at the top', () => {
    assert.equal(PRIORITY.critical, 5);
    assert.ok(PRIORITY.critical > PRIORITY.warning);
    assert.ok(PRIORITY.warning > PRIORITY.info);
});

test('a trailing slash on the server does not produce a double slash', async () => {
    await withEnv({ NTFY_TOPIC: 't', NTFY_SERVER: 'https://example.com/' }, () => {
        assert.equal(resolveConfig().server, 'https://example.com');
    });
});

test('an explicit override beats the environment', async () => {
    await withEnv({ NTFY_TOPIC: 'from-env' }, () => {
        assert.equal(resolveConfig({ topic: 'explicit' }).topic, 'explicit');
        assert.equal(resolveConfig().topic, 'from-env');
    });
});
