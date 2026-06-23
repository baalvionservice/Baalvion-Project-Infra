'use strict';
/**
 * Pure-logic unit tests for lib.js. No database, Redis, or network — these run
 * with the built-in node:test runner (`node --test`).
 */
const test = require('node:test');
const assert = require('node:assert/strict');

const {
    DEV_DB_PASSWORD_FALLBACK,
    requireSecret,
    resolveAllowedOrigins,
    getAllowOriginHeader,
    hasInfraRole,
} = require('./lib');

// ── requireSecret (production secret guard) ──────────────────────────────────
test('requireSecret returns the configured value when present', () => {
    assert.equal(requireSecret('DB_PASSWORD', 'real-secret', 'dev', 'production'), 'real-secret');
    assert.equal(requireSecret('DB_PASSWORD', 'real-secret', 'dev', 'development'), 'real-secret');
});

test('requireSecret falls back to the dev default outside production', () => {
    assert.equal(requireSecret('DB_PASSWORD', undefined, DEV_DB_PASSWORD_FALLBACK, 'development'), DEV_DB_PASSWORD_FALLBACK);
    assert.equal(requireSecret('DB_PASSWORD', '', DEV_DB_PASSWORD_FALLBACK, 'test'), DEV_DB_PASSWORD_FALLBACK);
    assert.equal(requireSecret('DB_PASSWORD', undefined, DEV_DB_PASSWORD_FALLBACK, undefined), DEV_DB_PASSWORD_FALLBACK);
});

test('requireSecret throws in production when the value is missing', () => {
    assert.throws(() => requireSecret('DB_PASSWORD', undefined, DEV_DB_PASSWORD_FALLBACK, 'production'), /DB_PASSWORD is required in production/);
    assert.throws(() => requireSecret('DB_PASSWORD', '', DEV_DB_PASSWORD_FALLBACK, 'production'), /required in production/);
});

test('requireSecret does NOT silently use the dev default in production', () => {
    let value;
    try {
        value = requireSecret('DB_PASSWORD', undefined, DEV_DB_PASSWORD_FALLBACK, 'production');
    } catch {
        value = '__threw__';
    }
    assert.notEqual(value, DEV_DB_PASSWORD_FALLBACK);
});

// ── resolveAllowedOrigins ────────────────────────────────────────────────────
test('resolveAllowedOrigins defaults to localhost:3030 when unset', () => {
    const origins = resolveAllowedOrigins(undefined);
    assert.ok(origins.has('http://localhost:3030'));
    assert.equal(origins.size, 1);
});

test('resolveAllowedOrigins parses, trims, and drops empties from a CSV list', () => {
    const origins = resolveAllowedOrigins('https://a.example.com, https://b.example.com , ,');
    assert.ok(origins.has('https://a.example.com'));
    assert.ok(origins.has('https://b.example.com'));
    assert.equal(origins.size, 2);
});

test('resolveAllowedOrigins never falls back to wildcard', () => {
    const origins = resolveAllowedOrigins('');
    assert.ok(!origins.has('*'));
});

// ── getAllowOriginHeader ─────────────────────────────────────────────────────
test('getAllowOriginHeader echoes an allow-listed origin', () => {
    const allowed = resolveAllowedOrigins('https://admin.example.com');
    assert.equal(getAllowOriginHeader('https://admin.example.com', allowed), 'https://admin.example.com');
});

test('getAllowOriginHeader returns null for a disallowed or missing origin', () => {
    const allowed = resolveAllowedOrigins('https://admin.example.com');
    assert.equal(getAllowOriginHeader('https://evil.example.com', allowed), null);
    assert.equal(getAllowOriginHeader(undefined, allowed), null);
    assert.equal(getAllowOriginHeader('', allowed), null);
});

// ── hasInfraRole (role gate) ─────────────────────────────────────────────────
test('hasInfraRole is true when the caller holds an infra role', () => {
    const infra = new Set(['super_admin', 'admin']);
    assert.equal(hasInfraRole(['member', 'admin'], infra), true);
    assert.equal(hasInfraRole(['super_admin'], infra), true);
});

test('hasInfraRole is false for non-infra roles, empty, or non-array input', () => {
    const infra = new Set(['super_admin', 'admin']);
    assert.equal(hasInfraRole(['member', 'viewer'], infra), false);
    assert.equal(hasInfraRole([], infra), false);
    assert.equal(hasInfraRole(undefined, infra), false);
    assert.equal(hasInfraRole(null, infra), false);
});
