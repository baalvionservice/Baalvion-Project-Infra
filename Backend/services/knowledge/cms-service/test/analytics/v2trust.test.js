'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fraud = require('../../service/analytics/fraudService');
const consent = require('../../service/analytics/consentService');
const quota = require('../../service/analytics/quotaService');
const adsense = require('../../connectors/adsense');

const evt = (over) => ({
    event: 'page_view', provider: 'first_party', sessionId: 's', visitorId: 'v',
    occurredAt: '2026-07-04T10:00:00.000Z', receivedAt: '2026-07-04T10:00:00.000Z',
    device: { type: 'desktop', os: 'Windows', browser: 'Chrome' }, ...over,
});

test('fraud: bot UA scores as flag', () => {
    const r = fraud.scoreEvent(evt({ device: { type: 'bot', os: 'unknown', browser: 'unknown' } }));
    assert.ok(r.score >= fraud.FLAG);
    assert.equal(r.action, 'flag');
});

test('fraud: clean human scores allow', () => {
    assert.equal(fraud.scoreEvent(evt()).action, 'allow');
});

test('fraud: referrer spam raises score', () => {
    const r = fraud.scoreEvent(evt({ referrer: 'https://semalt.com/' }));
    assert.ok(r.score >= fraud.FLAG);
    assert.ok(r.reasons.includes('referrer_spam'));
});

test('consent: normalize defaults to implied', () => {
    const c = consent.normalize(undefined);
    assert.equal(c.analytics_storage, 'implied');
    assert.equal(c.ad_storage, 'implied');
});

test('consent: strict requires granted; implied admits unless denied', () => {
    assert.equal(consent.isAdmissible({ analytics_storage: 'implied' }, 'strict'), false);
    assert.equal(consent.isAdmissible({ analytics_storage: 'granted' }, 'strict'), true);
    assert.equal(consent.isAdmissible({ analytics_storage: 'denied' }, 'implied'), false);
    assert.equal(consent.isAdmissible({ analytics_storage: 'implied' }, 'implied'), true);
});

test('quota: budgetFor returns a positive number with a default fallback', () => {
    assert.ok(quota.budgetFor('gsc') > 0);
    assert.ok(quota.budgetFor('some-unknown-provider') > 0);
});

test('adsense connector has the expected shape + validation', () => {
    assert.equal(adsense.provider, 'adsense');
    assert.ok(adsense.requiredCreds.includes('accountId'));
    assert.throws(() => adsense.validate({ accountId: 'pub-1' }), /missing credential/);
    assert.doesNotThrow(() => adsense.validate({ accountId: 'pub-1', oauthClientId: 'a', oauthClientSecret: 'b', refreshToken: 'c' }));
});
