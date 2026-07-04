'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseUserAgent, geoFromHeaders, deriveVisitorId, campaignFromUrl, classifyChannel } = require('../../service/analytics/enrich');

test('parseUserAgent classifies desktop Chrome', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
    const r = parseUserAgent(ua);
    assert.equal(r.type, 'desktop');
    assert.equal(r.os, 'Windows');
    assert.equal(r.browser, 'Chrome');
});

test('parseUserAgent classifies mobile iOS Safari', () => {
    const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
    const r = parseUserAgent(ua);
    assert.equal(r.type, 'mobile');
    assert.equal(r.os, 'iOS');
    assert.equal(r.browser, 'Safari');
});

test('parseUserAgent flags bots', () => {
    assert.equal(parseUserAgent('Googlebot/2.1 (+http://www.google.com/bot.html)').type, 'bot');
});

test('parseUserAgent handles empty UA', () => {
    assert.deepEqual(parseUserAgent(''), { type: 'unknown', os: 'unknown', browser: 'unknown' });
});

test('geoFromHeaders reads CDN country header', () => {
    assert.equal(geoFromHeaders({ 'cf-ipcountry': 'IN' }).country, 'IN');
});

test('deriveVisitorId is deterministic within a day and prefixed', () => {
    const a = deriveVisitorId('w1', '1.2.3.4', 'ua', 'salt', '2026-07-03');
    const b = deriveVisitorId('w1', '1.2.3.4', 'ua', 'salt', '2026-07-03');
    const c = deriveVisitorId('w1', '1.2.3.4', 'ua', 'salt', '2026-07-04');
    assert.equal(a, b);
    assert.notEqual(a, c);           // rotates daily
    assert.match(a, /^v_[0-9a-f]{24}$/);
});

test('campaignFromUrl extracts UTM params', () => {
    const c = campaignFromUrl('https://x.com/p?utm_source=news&utm_medium=email&utm_campaign=launch');
    assert.deepEqual(c, { source: 'news', medium: 'email', campaign: 'launch' });
});

test('campaignFromUrl tolerates a malformed URL', () => {
    assert.deepEqual(campaignFromUrl('not a url'), {});
});

test('classifyChannel: no referrer → direct', () => {
    assert.equal(classifyChannel({ referrer: '' }), 'direct');
});

test('classifyChannel: search engine referrer → organic', () => {
    assert.equal(classifyChannel({ referrer: 'https://www.google.com/search?q=x' }), 'organic');
});

test('classifyChannel: social referrer → social', () => {
    assert.equal(classifyChannel({ referrer: 'https://www.linkedin.com/feed/' }), 'social');
});

test('classifyChannel: UTM medium cpc → paid', () => {
    assert.equal(classifyChannel({ campaign: { medium: 'cpc' }, referrer: 'https://google.com' }), 'paid');
});

test('classifyChannel: same-host referrer → internal', () => {
    assert.equal(classifyChannel({ referrer: 'https://imperialpedia.baalvion.com/a', selfHost: 'imperialpedia.baalvion.com' }), 'internal');
});

test('classifyChannel: unknown external referrer → referral', () => {
    assert.equal(classifyChannel({ referrer: 'https://someblog.example/post' }), 'referral');
});
