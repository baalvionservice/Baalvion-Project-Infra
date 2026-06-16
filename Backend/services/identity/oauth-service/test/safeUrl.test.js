'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { assertSafeHttpUrl, isSafeHttpUrl, isBlockedHost } = require('../lib/safeUrl');

test('accepts a public https URL', () => {
    assert.strictEqual(assertSafeHttpUrl('https://rp.example.com/backchannel'),
        'https://rp.example.com/backchannel');
    assert.strictEqual(isSafeHttpUrl('https://rp.example.com/logout'), true);
});

test('rejects non-https when https is required', () => {
    assert.throws(() => assertSafeHttpUrl('http://rp.example.com/cb'), /https/);
    assert.strictEqual(isSafeHttpUrl('http://rp.example.com/cb'), false);
});

test('rejects loopback / localhost', () => {
    for (const u of [
        'https://localhost/cb',
        'https://127.0.0.1/cb',
        'https://[::1]/cb',
    ]) {
        assert.throws(() => assertSafeHttpUrl(u), /not allowed/, `expected block: ${u}`);
    }
});

test('rejects cloud metadata and link-local', () => {
    assert.throws(() => assertSafeHttpUrl('https://169.254.169.254/latest/meta-data/'), /not allowed/);
    assert.throws(() => assertSafeHttpUrl('https://metadata.google.internal/'), /not allowed/);
    assert.ok(isBlockedHost('169.254.0.1'));
    assert.ok(isBlockedHost('fe80::1'));
});

test('rejects RFC1918 private ranges', () => {
    for (const h of ['10.0.0.5', '192.168.1.1', '172.16.0.9', '172.31.255.254']) {
        assert.ok(isBlockedHost(h), `expected blocked: ${h}`);
    }
    // 172.32.x is NOT private — must be allowed through the host check.
    assert.strictEqual(isBlockedHost('172.32.0.1'), false);
});

test('rejects *.internal and *.local hostnames', () => {
    assert.ok(isBlockedHost('payments.svc.internal'));
    assert.ok(isBlockedHost('printer.local'));
});

test('rejects invalid / non-http(s) schemes', () => {
    assert.throws(() => assertSafeHttpUrl('not a url'), /Invalid URL/);
    assert.throws(() => assertSafeHttpUrl('ftp://example.com/x'), /https/);
    assert.throws(() => assertSafeHttpUrl('javascript:alert(1)'), /https/);
});

test('isSafeHttpUrl never throws on garbage input', () => {
    assert.strictEqual(isSafeHttpUrl(undefined), false);
    assert.strictEqual(isSafeHttpUrl(''), false);
    assert.strictEqual(isSafeHttpUrl('://broken'), false);
});
