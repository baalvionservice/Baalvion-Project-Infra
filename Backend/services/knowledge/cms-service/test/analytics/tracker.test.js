'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { TRACKER_JS, TRACKER_VERSION } = require('../../service/analytics/trackerScript');

test('tracker script is a non-trivial IIFE', () => {
    assert.equal(typeof TRACKER_JS, 'string');
    assert.ok(TRACKER_JS.length > 500);
    assert.match(TRACKER_JS, /^\(function\(\)\{/);
    assert.match(TRACKER_JS, /\}\)\(\);$/);
});

test('tracker emits the core traffic events', () => {
    for (const ev of ['session_start', 'page_view', 'scroll', 'session_end', 'web_vitals']) {
        assert.ok(TRACKER_JS.includes(`'${ev}'`), `missing event ${ev}`);
    }
});

test('tracker derives endpoint from its own src and honors DNT', () => {
    assert.match(TRACKER_JS, /collect\\\.js/);   // endpoint = src.replace(/collect\.js.*$/,'collect')
    assert.match(TRACKER_JS, /doNotTrack/);
    assert.match(TRACKER_JS, /sendBeacon/);
});

test('tracker script is syntactically valid JavaScript', () => {
    // Compiles the served source without executing it (no browser globals needed).
    assert.doesNotThrow(() => new Function(TRACKER_JS));
});

test('tracker version is exported', () => {
    assert.match(TRACKER_VERSION, /^\d+\.\d+\.\d+$/);
});
