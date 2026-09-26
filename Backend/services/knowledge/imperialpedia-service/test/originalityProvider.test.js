'use strict';

// Pure-logic tests for the external-originality-provider seam. No live provider is configured
// in this repo (see the file's header comment) — these tests cover the not-configured default,
// safe failure on a bad/unreachable provider, and strict validation of an untrusted provider
// response, all without any network access.

const test = require('node:test');
const assert = require('node:assert/strict');

const ENV_KEYS = ['ORIGINALITY_PROVIDER_URL', 'ORIGINALITY_PROVIDER_KEY', 'ORIGINALITY_PROVIDER_NAME'];

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

// Reads env vars fresh on every call (see originalityProvider.js header comment for why) —
// so, unlike aiService.js, no require-cache busting is needed between test cases here.
const provider = require('../service/originalityProvider');

test('analyzeOriginality resolves not_configured with zero network calls when no provider env is set', async () => {
    await withEnv({}, async () => {
        const originalFetch = global.fetch;
        let called = false;
        global.fetch = () => { called = true; return Promise.reject(new Error('should not be called')); };
        try {
            const result = await provider.analyzeOriginality('Some article text here.');
            assert.equal(result.status, 'not_configured');
            assert.equal(result.provider, null);
            assert.equal(result.similarity, null);
            assert.deepEqual(result.matches, []);
            assert.equal(called, false);
        } finally {
            global.fetch = originalFetch;
        }
    });
});

test('isConfigured reflects whether both URL and key are set', async () => {
    await withEnv({}, () => {
        assert.equal(provider.isConfigured(), false);
    });
    await withEnv({ ORIGINALITY_PROVIDER_URL: 'https://example.test/check', ORIGINALITY_PROVIDER_KEY: 'k' }, () => {
        assert.equal(provider.isConfigured(), true);
    });
});

test('analyzeOriginality degrades to status "error" — never throws — when the provider is unreachable', async () => {
    await withEnv({ ORIGINALITY_PROVIDER_URL: 'https://example.test/check', ORIGINALITY_PROVIDER_KEY: 'secret-key' }, async () => {
        const originalFetch = global.fetch;
        global.fetch = () => Promise.reject(new Error('network down'));
        try {
            const result = await provider.analyzeOriginality('Some article text here that is long enough to send.');
            assert.equal(result.status, 'error');
            assert.equal(result.similarity, null);
        } finally {
            global.fetch = originalFetch;
        }
    });
});

test('analyzeOriginality degrades to status "error" on a non-OK HTTP response', async () => {
    await withEnv({ ORIGINALITY_PROVIDER_URL: 'https://example.test/check', ORIGINALITY_PROVIDER_KEY: 'secret-key' }, async () => {
        const originalFetch = global.fetch;
        global.fetch = () => Promise.resolve({ ok: false, status: 500 });
        try {
            const result = await provider.analyzeOriginality('Some article text here that is long enough to send.');
            assert.equal(result.status, 'error');
        } finally {
            global.fetch = originalFetch;
        }
    });
});

test('analyzeOriginality never leaks the provider API key into its result', async () => {
    await withEnv({ ORIGINALITY_PROVIDER_URL: 'https://example.test/check', ORIGINALITY_PROVIDER_KEY: 'super-secret-key' }, async () => {
        const originalFetch = global.fetch;
        let capturedAuthHeader = null;
        global.fetch = (url, init) => {
            capturedAuthHeader = init.headers.authorization;
            return Promise.resolve({ ok: true, json: async () => ({ similarity: 0.1, matches: [] }) });
        };
        try {
            const result = await provider.analyzeOriginality('Some article text here that is long enough to send.');
            assert.equal(capturedAuthHeader, 'Bearer super-secret-key');
            assert.equal(JSON.stringify(result).includes('super-secret-key'), false);
        } finally {
            global.fetch = originalFetch;
        }
    });
});

test('analyzeOriginality normalizes a well-formed provider response', async () => {
    await withEnv({ ORIGINALITY_PROVIDER_URL: 'https://example.test/check', ORIGINALITY_PROVIDER_KEY: 'k', ORIGINALITY_PROVIDER_NAME: 'acme-originality' }, async () => {
        const originalFetch = global.fetch;
        global.fetch = () => Promise.resolve({
            ok: true,
            json: async () => ({ similarity: 0.42, matches: [{ source: 'Some Site', url: 'https://example.com/a', similarity: 0.42, excerpt: 'matching text' }], referenceId: 'ref-123' }),
        });
        try {
            const result = await provider.analyzeOriginality('Some article text here that is long enough to send.');
            assert.equal(result.status, 'checked');
            assert.equal(result.provider, 'acme-originality');
            assert.equal(result.similarity, 0.42);
            assert.equal(result.matches.length, 1);
            assert.equal(result.matches[0].source, 'Some Site');
            assert.equal(result.rawReference, 'ref-123');
        } finally {
            global.fetch = originalFetch;
        }
    });
});

test('analyzeOriginality treats a malformed provider response (bad similarity type) as untrusted and degrades to error', async () => {
    await withEnv({ ORIGINALITY_PROVIDER_URL: 'https://example.test/check', ORIGINALITY_PROVIDER_KEY: 'k' }, async () => {
        const originalFetch = global.fetch;
        global.fetch = () => Promise.resolve({ ok: true, json: async () => ({ similarity: 'very high', matches: 'not-an-array' }) });
        try {
            const result = await provider.analyzeOriginality('Some article text here that is long enough to send.');
            assert.equal(result.status, 'error');
        } finally {
            global.fetch = originalFetch;
        }
    });
});

test('analyzeOriginality rejects a similarity value outside the valid 0-1 range', () => {
    assert.equal(provider.isValidProviderPayload({ similarity: 1.5, matches: [] }), false);
    assert.equal(provider.isValidProviderPayload({ similarity: -0.1, matches: [] }), false);
    assert.equal(provider.isValidProviderPayload({ similarity: 0.5, matches: [] }), true);
});

test('normalizeMatches caps the list and strips unexpected fields from an untrusted payload', () => {
    const raw = Array.from({ length: 20 }, (_, i) => ({ source: `S${i}`, url: `https://x/${i}`, similarity: 0.5, excerpt: 'x', maliciousField: '<script>' }));
    const normalized = provider.normalizeMatches(raw);
    assert.equal(normalized.length, 10);
    assert.ok(!('maliciousField' in normalized[0]));
});

test('normalizeMatches returns an empty array for non-array input', () => {
    assert.deepEqual(provider.normalizeMatches('not-an-array'), []);
    assert.deepEqual(provider.normalizeMatches(undefined), []);
});

// --- validateOriginalityCheckInput: the DB-free input validation used by POST /ai/originality-check ---

test('validateOriginalityCheckInput rejects a request with no content', () => {
    const result = provider.validateOriginalityCheckInput({ title: 'A title' });
    assert.equal(result.ok, false);
    assert.match(result.error, /content is required/);
});

test('validateOriginalityCheckInput rejects whitespace-only content', () => {
    const result = provider.validateOriginalityCheckInput({ content: '   \n\t  ' });
    assert.equal(result.ok, false);
});

test('validateOriginalityCheckInput accepts a well-formed request and trims/caps fields', () => {
    const result = provider.validateOriginalityCheckInput({ title: 'How to Save', content: 'Some real article content here.', slug: 'how-to-save' });
    assert.equal(result.ok, true);
    assert.equal(result.value.title, 'How to Save');
    assert.equal(result.value.content, 'Some real article content here.');
    assert.equal(result.value.slug, 'how-to-save');
});

test('validateOriginalityCheckInput strips null bytes from content', () => {
    const result = provider.validateOriginalityCheckInput({ content: 'Some\x00content\x00here with enough length.' });
    assert.equal(result.ok, true);
    assert.equal(result.value.content.includes('\x00'), false);
});

test('validateOriginalityCheckInput ignores a non-object body instead of throwing', () => {
    assert.doesNotThrow(() => provider.validateOriginalityCheckInput(null));
    assert.doesNotThrow(() => provider.validateOriginalityCheckInput('not an object'));
    assert.equal(provider.validateOriginalityCheckInput(null).ok, false);
});

test('validateOriginalityCheckInput discards a non-object "options" value rather than passing it through', () => {
    const result = provider.validateOriginalityCheckInput({ content: 'Enough content to pass validation here.', options: 'not-an-object' });
    assert.deepEqual(result.value.options, {});
});

// --- route wiring: authMiddleware must gate the originality-check endpoint ---
// Reads the route file as TEXT rather than require()-ing it, because requiring aiRoutes.js
// pulls in aiController.js -> models/index.js -> the service's env-gated config loader (it
// throws without JWT_PUBLIC_KEY etc. set), which this pure-logic test suite deliberately never
// configures — matching this repo's existing convention of DB/env-free unit tests only.

const fs = require('node:fs');
const path = require('node:path');

test('POST /ai/originality-check is wired behind authMiddleware, like /ai/article-analysis', () => {
    const source = fs.readFileSync(path.join(__dirname, '../routes/aiRoutes.js'), 'utf8');
    const originalityLine = source.split('\n').find((l) => l.includes("'/originality-check'"));
    const analysisLine = source.split('\n').find((l) => l.includes("'/article-analysis'"));
    assert.ok(originalityLine, 'originality-check route not found');
    assert.match(originalityLine, /authMiddleware/);
    assert.match(analysisLine, /authMiddleware/);
    // The unauthenticated routes above them must stay that way (status/asset-summary) — this
    // guards against accidentally widening auth to routes that are anonymous-friendly by design.
    const statusLine = source.split('\n').find((l) => l.includes("'/status'"));
    assert.doesNotMatch(statusLine, /authMiddleware/);
});
