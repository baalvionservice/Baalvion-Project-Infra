'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { collectSchema, reportQuerySchema } = require('../../validators/analyticsSchemas');

test('collectSchema accepts a valid beacon payload', () => {
    const r = collectSchema.safeParse({ site: 'imperialpedia', events: [{ event: 'page_view', page: '/', url: 'https://x.com/' }] });
    assert.equal(r.success, true);
    assert.equal(r.data.events[0].event, 'page_view');
});

test('collectSchema rejects a missing site', () => {
    assert.equal(collectSchema.safeParse({ events: [{ event: 'page_view' }] }).success, false);
});

test('collectSchema rejects an empty events array', () => {
    assert.equal(collectSchema.safeParse({ site: 'x', events: [] }).success, false);
});

test('collectSchema rejects an event with no event name', () => {
    assert.equal(collectSchema.safeParse({ site: 'x', events: [{ page: '/' }] }).success, false);
});

test('reportQuerySchema coerces limit and windowMin to numbers', () => {
    const r = reportQuerySchema.safeParse({ limit: '50', windowMin: '10' });
    assert.equal(r.success, true);
    assert.equal(r.data.limit, 50);
    assert.equal(r.data.windowMin, 10);
});

test('reportQuerySchema rejects a malformed date', () => {
    assert.equal(reportQuerySchema.safeParse({ from: '07/03/2026' }).success, false);
});

test('reportQuerySchema accepts ISO dates', () => {
    assert.equal(reportQuerySchema.safeParse({ from: '2026-06-01', to: '2026-07-03' }).success, true);
});
