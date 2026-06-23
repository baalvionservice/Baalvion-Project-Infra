'use strict';

/**
 * Pure-logic unit tests — no live DB or network required.
 *
 * Covers the DB-free helpers exported by tenantService:
 *   - assertSlug(): the tenant-slug validator (throws AppError on bad input)
 *   - mapBranding(): the camelCase request → snake_case column mapper
 *
 * Run: `node --test` (uses the built-in node:test runner; no extra deps).
 */

const test = require('node:test');
const assert = require('node:assert');

const { assertSlug, mapBranding } = require('../services/tenantService');
const { AppError } = require('../utils/errors');

// ── assertSlug ──────────────────────────────────────────────────────────────

test('assertSlug accepts a valid lowercase-alphanumeric-hyphen slug', () => {
    // Arrange / Act / Assert — should not throw
    assert.doesNotThrow(() => assertSlug('acme-corp'));
    assert.doesNotThrow(() => assertSlug('abc'));
    assert.doesNotThrow(() => assertSlug('a1b2c3'));
});

test('assertSlug rejects slugs shorter than 3 chars', () => {
    assert.throws(() => assertSlug('ab'), AppError);
});

test('assertSlug rejects uppercase, spaces, and leading/trailing hyphens', () => {
    assert.throws(() => assertSlug('Acme'), AppError);
    assert.throws(() => assertSlug('acme corp'), AppError);
    assert.throws(() => assertSlug('-acme'), AppError);
    assert.throws(() => assertSlug('acme-'), AppError);
});

test('assertSlug rejects empty / null / undefined input', () => {
    assert.throws(() => assertSlug(''), AppError);
    assert.throws(() => assertSlug(null), AppError);
    assert.throws(() => assertSlug(undefined), AppError);
});

test('assertSlug throws a 400 BAD_REQUEST AppError', () => {
    try {
        assertSlug('NOPE');
        assert.fail('expected assertSlug to throw');
    } catch (err) {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(err.code, 'BAD_REQUEST');
    }
});

// ── mapBranding ─────────────────────────────────────────────────────────────

test('mapBranding maps camelCase fields to snake_case columns', () => {
    // Arrange
    const input = {
        brandName: 'Acme', logoUrl: 'https://x/logo.png', primaryColor: '#fff',
        supportEmail: 'help@acme.test', theme: { mode: 'dark' },
    };

    // Act
    const out = mapBranding(input);

    // Assert
    assert.strictEqual(out.brand_name, 'Acme');
    assert.strictEqual(out.logo_url, 'https://x/logo.png');
    assert.strictEqual(out.primary_color, '#fff');
    assert.strictEqual(out.support_email, 'help@acme.test');
    assert.deepStrictEqual(out.theme, { mode: 'dark' });
});

test('mapBranding defaults missing fields to null and theme to {}', () => {
    const out = mapBranding({});
    assert.strictEqual(out.brand_name, null);
    assert.strictEqual(out.logo_url, null);
    assert.strictEqual(out.secondary_color, null);
    assert.deepStrictEqual(out.theme, {});
});

test('mapBranding treats enabled as true unless explicitly false', () => {
    assert.strictEqual(mapBranding({}).enabled, true);
    assert.strictEqual(mapBranding({ enabled: true }).enabled, true);
    assert.strictEqual(mapBranding({ enabled: false }).enabled, false);
});

test('mapBranding called with no argument does not throw and returns defaults', () => {
    const out = mapBranding();
    assert.strictEqual(out.brand_name, null);
    assert.strictEqual(out.enabled, true);
});
