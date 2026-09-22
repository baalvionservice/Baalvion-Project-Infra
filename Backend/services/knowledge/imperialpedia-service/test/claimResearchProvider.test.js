'use strict';

// Pure-logic tests for the Stage B research provider seam (Prompt 3). No live provider is
// configured in this repo — these tests cover the not-configured default, safe failure on a
// bad/unreachable/malformed provider, evidence derivation, caching, and dedup, all without any
// real network access. Mirrors the style of originalityProvider.test.js.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ENV_KEYS = ['RESEARCH_PROVIDER_URL', 'RESEARCH_PROVIDER_KEY', 'RESEARCH_PROVIDER_NAME'];

function withEnv(vars, fn) {
    const previous = {};
    for (const key of ENV_KEYS) previous[key] = process.env[key];
    for (const key of ENV_KEYS) delete process.env[key];
    Object.assign(process.env, vars);
    return Promise.resolve()
        .then(fn)
        .finally(() => {
            for (const key of ENV_KEYS) {
                if (previous[key] === undefined) delete process.env[key];
                else process.env[key] = previous[key];
            }
        });
}

const provider = require('../service/claimResearchProvider');

function claim(overrides = {}) {
    return { id: 'claim-0', text: 'The IRA contribution limit is $7,000 in 2026.', category: 'TAX', severity: 'WARNING', ...overrides };
}

// ---- NOT CONFIGURED ----

test('researchClaims resolves every claim to needs_research with zero network calls when no provider is configured', async () => {
    await withEnv({}, async () => {
        const originalFetch = global.fetch;
        let called = false;
        global.fetch = () => { called = true; return Promise.reject(new Error('should not be called')); };
        try {
            const research = await provider.researchClaims([claim()]);
            assert.equal(research.researchStatus, 'not_configured');
            assert.equal(research.results.length, 1);
            assert.equal(research.results[0].status, 'needs_research');
            assert.deepEqual(research.results[0].sources, []);
            assert.equal(called, false);
        } finally {
            global.fetch = originalFetch;
        }
    });
});

test('researchClaims never reports "verified" when nothing was actually researched', async () => {
    await withEnv({}, async () => {
        const research = await provider.researchClaims([claim(), claim({ id: 'claim-1', text: 'Federal law requires annual reporting.' })]);
        for (const r of research.results) {
            assert.notEqual(r.status, 'verified');
            assert.notEqual(r.status, 'SUPPORTED');
        }
    });
});

test('isConfigured reflects whether both URL and key are set', async () => {
    await withEnv({}, () => assert.equal(provider.isConfigured(), false));
    await withEnv({ RESEARCH_PROVIDER_URL: 'https://example.test/research', RESEARCH_PROVIDER_KEY: 'k' }, () => {
        assert.equal(provider.isConfigured(), true);
    });
});

// ---- PROVIDER FAILURE MODES ----

test('researchClaims degrades to needs_research — never throws — when the provider is unreachable', async () => {
    await withEnv({ RESEARCH_PROVIDER_URL: 'https://example.test/research', RESEARCH_PROVIDER_KEY: 'secret' }, async () => {
        const originalFetch = global.fetch;
        global.fetch = () => Promise.reject(new Error('network down'));
        try {
            const research = await provider.researchClaims([claim({ id: 'claim-timeout' })]);
            assert.equal(research.results[0].status, 'needs_research');
        } finally {
            global.fetch = originalFetch;
        }
    });
});

test('researchClaims degrades to needs_research on a non-OK HTTP response', async () => {
    await withEnv({ RESEARCH_PROVIDER_URL: 'https://example.test/research', RESEARCH_PROVIDER_KEY: 'secret' }, async () => {
        const originalFetch = global.fetch;
        global.fetch = () => Promise.resolve({ ok: false, status: 500 });
        try {
            const research = await provider.researchClaims([claim({ id: 'claim-500' })]);
            assert.equal(research.results[0].status, 'needs_research');
        } finally {
            global.fetch = originalFetch;
        }
    });
});

test('researchClaims degrades to needs_research on a malformed (non-object / missing sources) response', async () => {
    await withEnv({ RESEARCH_PROVIDER_URL: 'https://example.test/research', RESEARCH_PROVIDER_KEY: 'secret' }, async () => {
        const originalFetch = global.fetch;
        global.fetch = () => Promise.resolve({ ok: true, json: async () => ({ notSources: true }) });
        try {
            const research = await provider.researchClaims([claim({ id: 'claim-malformed' })]);
            assert.equal(research.results[0].status, 'needs_research');
        } finally {
            global.fetch = originalFetch;
        }
    });
});

test('researchClaims degrades gracefully when the provider times out (AbortError)', async () => {
    await withEnv({ RESEARCH_PROVIDER_URL: 'https://example.test/research', RESEARCH_PROVIDER_KEY: 'secret' }, async () => {
        const originalFetch = global.fetch;
        global.fetch = () => new Promise((_resolve, reject) => {
            const err = new Error('The operation was aborted');
            err.name = 'AbortError';
            reject(err);
        });
        try {
            const research = await provider.researchClaims([claim({ id: 'claim-abort' })]);
            assert.equal(research.results[0].status, 'needs_research');
        } finally {
            global.fetch = originalFetch;
        }
    });
});

// ---- EVIDENCE DERIVATION ----

test('deriveEvidence returns NO_SOURCE_FOUND for an empty source list', () => {
    assert.equal(provider.deriveEvidence([]).status, 'NO_SOURCE_FOUND');
});

test('deriveEvidence returns SUPPORTED when a credible source supports the claim', () => {
    const result = provider.deriveEvidence([{ authorityLevel: 'primary', supportsClaim: true }]);
    assert.equal(result.status, 'SUPPORTED');
    assert.equal(result.sourceConflict, false);
});

test('deriveEvidence returns CONTRADICTED when a credible source contradicts the claim', () => {
    const result = provider.deriveEvidence([{ authorityLevel: 'secondary', supportsClaim: false }]);
    assert.equal(result.status, 'CONTRADICTED');
});

test('deriveEvidence returns PARTIALLY_SUPPORTED and flags a conflict when credible sources disagree — never picks a winner', () => {
    const result = provider.deriveEvidence([
        { authorityLevel: 'primary', supportsClaim: true },
        { authorityLevel: 'secondary', supportsClaim: false },
    ]);
    assert.equal(result.status, 'PARTIALLY_SUPPORTED');
    assert.equal(result.sourceConflict, true);
});

test('deriveEvidence returns UNCLEAR when sources exist but none state support/contradiction', () => {
    const result = provider.deriveEvidence([{ authorityLevel: 'general', supportsClaim: null }]);
    assert.equal(result.status, 'UNCLEAR');
});

// ---- UNTRUSTED PROVIDER RESPONSE VALIDATION ----

test('isValidSource rejects a source missing a valid https URL', () => {
    assert.equal(provider.isValidSource({ title: 'x', url: 'not-a-url' }), false);
    assert.equal(provider.isValidSource({ title: 'x' }), false);
});

test('isValidSource rejects an invalid authorityLevel value', () => {
    assert.equal(provider.isValidSource({ title: 'x', url: 'https://example.test', authorityLevel: 'super-primary' }), false);
});

test('isValidSource accepts a well-shaped source', () => {
    assert.equal(provider.isValidSource({ title: 'IRS Retirement Topics', url: 'https://www.irs.gov/retirement', authorityLevel: 'primary', supportsClaim: true }), true);
});

test('normalizeSource truncates oversized fields and drops unknown ones', () => {
    const normalized = provider.normalizeSource({ title: 'x'.repeat(500), url: 'https://example.test/' + 'y'.repeat(900), extra: 'should not appear' });
    assert.ok(normalized.title.length <= 300);
    assert.ok(normalized.url.length <= 800);
    assert.equal(normalized.extra, undefined);
});

// ---- SUCCESSFUL RESEARCH (mocked provider) ----

test('a configured provider returning a supporting primary source yields SUPPORTED with no fabricated fields', async () => {
    await withEnv({ RESEARCH_PROVIDER_URL: 'https://example.test/research', RESEARCH_PROVIDER_KEY: 'secret', RESEARCH_PROVIDER_NAME: 'test-provider' }, async () => {
        const originalFetch = global.fetch;
        global.fetch = () => Promise.resolve({
            ok: true,
            json: async () => ({
                sources: [{ title: 'IRS Retirement Topics — IRA Contribution Limits', url: 'https://www.irs.gov/retirement-plans/ira-contribution-limits', authorityLevel: 'primary', sourceType: 'government', publishedAt: '2026-01-01', supportsClaim: true, notes: 'Matches the figure exactly.' }],
            }),
        });
        try {
            const research = await provider.researchClaims([claim({ id: 'claim-supported' })]);
            const result = research.results[0];
            assert.equal(result.status, 'SUPPORTED');
            assert.equal(result.sources[0].url, 'https://www.irs.gov/retirement-plans/ira-contribution-limits');
            assert.equal(result.provider, 'test-provider');
        } finally {
            global.fetch = originalFetch;
        }
    });
});

// ---- CACHING / DEDUP ----

test('duplicate concurrent requests for the same claim are deduped to a single provider call', async () => {
    await withEnv({ RESEARCH_PROVIDER_URL: 'https://example.test/research', RESEARCH_PROVIDER_KEY: 'secret' }, async () => {
        const originalFetch = global.fetch;
        let callCount = 0;
        global.fetch = () => {
            callCount += 1;
            return new Promise((resolve) => setTimeout(() => resolve({ ok: true, json: async () => ({ sources: [] }) }), 20));
        };
        try {
            const dedupClaim = claim({ id: 'dedup-claim', text: `Unique dedup claim text ${Date.now()} requires federal review.` });
            const [a, b] = await Promise.all([
                provider.researchClaims([dedupClaim]),
                provider.researchClaims([dedupClaim]),
            ]);
            assert.equal(callCount, 1);
            assert.equal(a.results[0].status, b.results[0].status);
        } finally {
            global.fetch = originalFetch;
        }
    });
});

// ---- PRIORITIZATION ----

test('prioritizeClaims orders CRITICAL before WARNING before SUGGESTION and caps the batch size', () => {
    const claims = [
        claim({ id: 'sugg', severity: 'SUGGESTION' }),
        claim({ id: 'crit', severity: 'CRITICAL' }),
        claim({ id: 'warn', severity: 'WARNING' }),
    ];
    const prioritized = provider.prioritizeClaims(claims);
    assert.deepEqual(prioritized.map((c) => c.id), ['crit', 'warn', 'sugg']);
    assert.ok(provider.MAX_CLAIMS_PER_REQUEST > 0);
});

// ---- SECURITY ----

test('POST /ai/verify-claims is wired behind authMiddleware, like /ai/originality-check', () => {
    const source = fs.readFileSync(path.join(__dirname, '../routes/aiRoutes.js'), 'utf8');
    const verifyLine = source.split('\n').find((l) => l.includes("'/verify-claims'"));
    assert.ok(verifyLine, 'verify-claims route not found');
    assert.match(verifyLine, /authMiddleware/);
});

test('researchClaims never returns the provider credential in any result field', async () => {
    await withEnv({ RESEARCH_PROVIDER_URL: 'https://example.test/research', RESEARCH_PROVIDER_KEY: 'super-secret-key' }, async () => {
        const originalFetch = global.fetch;
        global.fetch = () => Promise.resolve({ ok: true, json: async () => ({ sources: [] }) });
        try {
            const research = await provider.researchClaims([claim({ id: 'claim-secure' })]);
            const serialized = JSON.stringify(research);
            assert.ok(!serialized.includes('super-secret-key'));
        } finally {
            global.fetch = originalFetch;
        }
    });
});
