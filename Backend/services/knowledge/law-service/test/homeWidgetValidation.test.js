'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { validateHomeWidgetItem } = require('../utils/homeWidgetValidation');

const breaking = { widget: 'breaking', title: 'Court grants stay', source_name: 'Docket filing', event_at: '2026-09-21T10:00:00Z', expires_at: '2026-09-21T20:00:00Z' };

test('a breaking item needs a source and an expiry, and cannot linger past 48 hours', () => {
    assert.doesNotThrow(() => validateHomeWidgetItem({ ...breaking }, true));
    assert.throws(() => validateHomeWidgetItem({ ...breaking, source_name: '' }, true));
    assert.throws(() => validateHomeWidgetItem({ ...breaking, expires_at: undefined }, true));
    assert.throws(() => validateHomeWidgetItem({ ...breaking, expires_at: '2026-09-25T10:00:00Z' }, true));
    assert.throws(() => validateHomeWidgetItem({ ...breaking, expires_at: '2026-09-21T09:00:00Z' }, true));
});

test('a photo is refused without a credit, and links must be https', () => {
    const photo = { widget: 'gallery', title: 'Courthouse', image_url: 'https://upload.wikimedia.org/x.jpg', credit: 'Jane Doe / CC BY 4.0' };
    assert.doesNotThrow(() => validateHomeWidgetItem({ ...photo }, true));
    assert.throws(() => validateHomeWidgetItem({ ...photo, credit: '' }, true));
    assert.throws(() => validateHomeWidgetItem({ ...photo, image_url: 'http://x.test/a.jpg' }, true));
});

test('a docket entry needs its court and status', () => {
    const d = { widget: 'docket', title: 'State v. Example', url: 'https://example.gov/docket/1', extra: { court: 'NY Supreme Court', status: 'Trial' } };
    assert.doesNotThrow(() => validateHomeWidgetItem({ ...d }, true));
    assert.throws(() => validateHomeWidgetItem({ ...d, extra: { court: 'NY Supreme Court' } }, true));
});

test('a region must be a country code or INTL', () => {
    const t = { widget: 'ticker', title: 'Cases pending', value: '9' };
    assert.doesNotThrow(() => validateHomeWidgetItem({ ...t, region: 'GB' }, true));
    assert.doesNotThrow(() => validateHomeWidgetItem({ ...t, region: 'INTL' }, true));
    assert.throws(() => validateHomeWidgetItem({ ...t, region: 'United Kingdom' }, true));
});

test('an unknown widget is refused and a kind cannot change on update', () => {
    assert.throws(() => validateHomeWidgetItem({ widget: 'heatmap', title: 'x' }, true));
    const patch = { widget: 'ticker', title: 'New title' };
    validateHomeWidgetItem(patch, false);
    assert.ok(!('widget' in patch));
});
