'use strict';
// Pure-logic unit tests — no live DB, Redis, or network required.
// Covers the deterministic helpers used by the risk-scoring pipeline:
//   - utils/deviceParser  (parseDevice, deviceFingerprint)
//   - utils/geo           (lookupIp, distanceKm)
//   - utils/errors        (AppError shape)
// Run with: node --test

const test   = require('node:test');
const assert = require('node:assert');

const { parseDevice, deviceFingerprint } = require('../utils/deviceParser');
const { lookupIp, distanceKm }           = require('../utils/geo');
const { AppError }                        = require('../utils/errors');

const CHROME_UA =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// ── deviceParser.parseDevice ──────────────────────────────────────────────────

test('parseDevice returns unknown shape for missing user agent', () => {
    // Arrange / Act
    const result = parseDevice(null);

    // Assert
    assert.deepStrictEqual(result, { browser: null, os: null, device: null, type: 'unknown' });
});

test('parseDevice treats an empty string like a missing user agent', () => {
    assert.deepStrictEqual(parseDevice(''), { browser: null, os: null, device: null, type: 'unknown' });
});

test('parseDevice extracts browser and os from a desktop Chrome UA', () => {
    // Act
    const result = parseDevice(CHROME_UA);

    // Assert
    assert.match(result.browser, /^Chrome /);
    assert.match(result.os, /^Windows/);
    assert.strictEqual(result.type, 'desktop');
});

// ── deviceParser.deviceFingerprint ────────────────────────────────────────────

test('deviceFingerprint is deterministic and an 8-char hex string', () => {
    const fp = deviceFingerprint(CHROME_UA);

    assert.strictEqual(fp, deviceFingerprint(CHROME_UA)); // stable
    assert.strictEqual(fp.length, 8);
    assert.match(fp, /^[0-9a-f]{8}$/);
});

test('deviceFingerprint differs for different user agents', () => {
    assert.notStrictEqual(deviceFingerprint(CHROME_UA), deviceFingerprint('curl/8.0.1'));
});

// ── geo.lookupIp ──────────────────────────────────────────────────────────────

test('lookupIp returns LOCAL for loopback and private addresses', () => {
    for (const ip of ['127.0.0.1', '::1', '192.168.1.10', '10.0.0.5']) {
        assert.strictEqual(lookupIp(ip).country, 'LOCAL', `expected LOCAL for ${ip}`);
    }
});

test('lookupIp returns LOCAL (null-safe) when ip is missing', () => {
    assert.strictEqual(lookupIp(null).country, 'LOCAL');
});

// ── geo.distanceKm ────────────────────────────────────────────────────────────

test('distanceKm returns null when any coordinate is missing', () => {
    assert.strictEqual(distanceKm(null, 1, 2, 3), null);
    assert.strictEqual(distanceKm(1, null, 2, 3), null);
    assert.strictEqual(distanceKm(1, 2, null, 3), null);
    assert.strictEqual(distanceKm(1, 2, 3, null), null);
});

test('distanceKm is zero for identical coordinates', () => {
    assert.strictEqual(distanceKm(10, 10, 10, 10), 0);
});

test('distanceKm approximates the London-to-New-York great-circle distance', () => {
    // London (51.5074, -0.1278) -> New York (40.7128, -74.0060) ~= 5570 km
    const dist = distanceKm(51.5074, -0.1278, 40.7128, -74.006);
    assert.ok(dist > 5400 && dist < 5700, `expected ~5570km, got ${dist}`);
});

// ── errors.AppError ───────────────────────────────────────────────────────────

test('AppError carries code, status, and details', () => {
    const err = new AppError('VALIDATION_ERROR', 'bad input', 400, { field: 'userId' });

    assert.ok(err instanceof Error);
    assert.strictEqual(err.code, 'VALIDATION_ERROR');
    assert.strictEqual(err.message, 'bad input');
    assert.strictEqual(err.statusCode, 400);
    assert.deepStrictEqual(err.details, { field: 'userId' });
});

test('AppError defaults statusCode to 400 and details to an empty object', () => {
    const err = new AppError('SOME_CODE', 'msg');

    assert.strictEqual(err.statusCode, 400);
    assert.deepStrictEqual(err.details, {});
});
