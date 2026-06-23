'use strict';
/**
 * Pure-logic unit tests — NO live DB / network required.
 *
 * Runner: Node's built-in test runner (`node --test`). No test framework is added
 * to the service; this file uses only `node:test` + `node:assert` from core.
 *
 * Covers:
 *   1. The zod auth body-validation schemas (middleware/validate.js). These must stay
 *      PERMISSIVE — they only reject when the controllers' own manual presence checks
 *      would also have rejected (missing/blank email|password|token).
 *   2. The pure scoring helper (utils/score.js).
 */
const test = require('node:test');
const assert = require('node:assert/strict');

const { schemas } = require('../middleware/validate');
const { computeScores } = require('../utils/score');

// ─────────────────────────────────────────────────────────────
// register schema — presence + type only
// ─────────────────────────────────────────────────────────────
test('registerSchema accepts a minimal valid body (email + password)', () => {
    const r = schemas.registerSchema.safeParse({ email: 'a@b.com', password: 'pw' });
    assert.equal(r.success, true);
});

test('registerSchema accepts optional username + full_name', () => {
    const r = schemas.registerSchema.safeParse({
        email: 'a@b.com', password: 'pw', username: 'neo', full_name: 'Thomas Anderson',
    });
    assert.equal(r.success, true);
});

test('registerSchema does NOT reject a non-email-formatted email (stays permissive)', () => {
    // The controller accepts any non-empty string and normalizes it; the schema must not be stricter.
    const r = schemas.registerSchema.safeParse({ email: 'not-an-email', password: 'pw' });
    assert.equal(r.success, true);
});

test('registerSchema does NOT reject a short password (length lives in the controller)', () => {
    const r = schemas.registerSchema.safeParse({ email: 'a@b.com', password: 'x' });
    assert.equal(r.success, true);
});

test('registerSchema rejects a missing password', () => {
    const r = schemas.registerSchema.safeParse({ email: 'a@b.com' });
    assert.equal(r.success, false);
});

test('registerSchema rejects a blank email', () => {
    const r = schemas.registerSchema.safeParse({ email: '', password: 'pw' });
    assert.equal(r.success, false);
});

test('registerSchema rejects a non-string password', () => {
    const r = schemas.registerSchema.safeParse({ email: 'a@b.com', password: 12345 });
    assert.equal(r.success, false);
});

// ─────────────────────────────────────────────────────────────
// login schema — presence + type only
// ─────────────────────────────────────────────────────────────
test('loginSchema accepts a minimal valid body', () => {
    const r = schemas.loginSchema.safeParse({ email: 'a@b.com', password: 'pw' });
    assert.equal(r.success, true);
});

test('loginSchema rejects an empty body', () => {
    const r = schemas.loginSchema.safeParse({});
    assert.equal(r.success, false);
});

test('loginSchema ignores extra unknown fields (passthrough, not stricter)', () => {
    const r = schemas.loginSchema.safeParse({ email: 'a@b.com', password: 'pw', remember: true });
    assert.equal(r.success, true);
});

// ─────────────────────────────────────────────────────────────
// reset-password schema — presence + type only
// ─────────────────────────────────────────────────────────────
test('resetPasswordSchema accepts token + password', () => {
    const r = schemas.resetPasswordSchema.safeParse({ token: 'abc', password: 'pw' });
    assert.equal(r.success, true);
});

test('resetPasswordSchema rejects a missing token', () => {
    const r = schemas.resetPasswordSchema.safeParse({ password: 'pw' });
    assert.equal(r.success, false);
});

// ─────────────────────────────────────────────────────────────
// computeScores — pure scoring helper
// ─────────────────────────────────────────────────────────────
test('computeScores returns 0-100 bounded scores for an empty profile', () => {
    const result = computeScores({}, [], []);
    assert.ok(result.profile_score >= 0 && result.profile_score <= 100);
    assert.ok(result.readiness_score >= 0 && result.readiness_score <= 100);
    assert.ok(Array.isArray(result.flags));
    assert.ok(result.breakdown && typeof result.breakdown.completeness === 'number');
});

test('computeScores flags a missing "why now" on an empty profile', () => {
    const result = computeScores({}, [], []);
    assert.ok(result.flags.some((f) => /why now/i.test(f)));
});

test('computeScores scores a richer profile higher than an empty one', () => {
    const rich = computeScores(
        {
            company_name: 'Acme', headline: 'AI for X', idea: 'a '.repeat(120),
            problem: 'p', solution: 's', why_now: 'now', differentiation: 'moat',
            sector: 'fintech', region: 'US', stage: 'seed', video_url: 'http://v',
            contact_email: 'c@d.com', market_tam: '10B', business_model: 'saas',
            raising: true, pitch_deck_url: 'http://deck',
        },
        [{ verified: true }, { verified: true }, { verified: true }, { verified: true }],
        ['identity', 'company'],
    );
    const empty = computeScores({}, [], []);
    assert.ok(rich.profile_score > empty.profile_score);
    assert.ok(rich.readiness_score > empty.readiness_score);
});
