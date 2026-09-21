'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { parseFeed } = require('../service/editorial/trends/feedParser');
const { fetchFeedArticles, FEEDS } = require('../service/editorial/trends/entertainmentFeeds');

const NOW = new Date('2026-09-21T12:00:00Z');
const rss = (items) => `<rss><channel>${items.map((i) => `<item><title>${i.t}</title><link>${i.l}</link><description>BODY TEXT THAT MUST NEVER BE STORED</description><pubDate>${i.d}</pubDate><guid>${i.l}</guid></item>`).join('')}</channel></rss>`;
const ago = (h) => new Date(NOW.getTime() - h * 3600000).toUTCString();

test('a feed parses to headline, link and date only, with entities decoded and CDATA unwrapped', () => {
    const [a] = parseFeed(rss([{ t: '<![CDATA[Paramount &amp; the &#8216;deal&#8217;]]>', l: 'https://v.test/a', d: ago(1) }]));
    assert.strictEqual(a.title, 'Paramount & the ‘deal’');
    assert.deepStrictEqual(Object.keys(a).sort(), ['date', 'id', 'link', 'title']);
    assert.throws(() => parseFeed('<html></html>'));
});

test('only recent, https items become headline-only signals, newest first, capped per feed', async () => {
    const feeds = [{ id: 'v', name: 'Variety', department: 'movies', url: 'https://v.test/feed' }];
    const items = [
        { t: 'Fresh story', l: 'https://v.test/1', d: ago(2) }, { t: 'Older story', l: 'https://v.test/2', d: ago(30) },
        { t: 'Stale story', l: 'https://v.test/3', d: ago(200) }, { t: 'Insecure link', l: 'http://v.test/4', d: ago(1) },
        { t: 'Future dated', l: 'https://v.test/5', d: ago(-20) },
    ];
    const { articles, report } = await fetchFeedArticles({ getText: async () => rss(items), now: NOW, feeds, perFeed: 5 });
    assert.deepStrictEqual(articles.map((a) => a.title), ['Fresh story', 'Older story']);
    assert.ok(articles.every((a) => a.summary_raw === '' && a.source.name === 'Variety' && a.category === 'Entertainment'), 'no outlet text is kept');
    assert.strictEqual(report[0].items, 2);
    const capped = await fetchFeedArticles({ getText: async () => rss(items), now: NOW, feeds, perFeed: 1 });
    assert.strictEqual(capped.articles.length, 1);
});

test('one broken feed is reported and does not stop the others', async () => {
    const feeds = [{ id: 'a', name: 'A', department: 'music', url: 'https://a.test' }, { id: 'b', name: 'B', department: 'music', url: 'https://b.test' }];
    const { articles, report } = await fetchFeedArticles({ getText: async (u) => { if (u.includes('a.test')) throw new Error('HTTP 503'); return rss([{ t: 'Works', l: 'https://b.test/1', d: ago(1) }]); }, now: NOW, feeds });
    assert.strictEqual(articles.length, 1);
    assert.strictEqual(report.find((r) => r.id === 'a').error, 'HTTP 503');
});

test('every listed feed is https, uniquely named, and has a department', () => {
    assert.strictEqual(new Set(FEEDS.map((f) => f.id)).size, FEEDS.length);
    for (const f of FEEDS) { assert.ok(f.url.startsWith('https://'), f.id); assert.match(f.department, /^(movies|tv|music|celebrity)$/); }
});

test('nested or encoded markup in a headline never survives as tags', () => {
    const [a] = parseFeed(rss([{ t: '<<b>script>alert(1)</b> &lt;script&gt;x&lt;/script&gt; Real headline', l: 'https://v.test/a', d: ago(1) }]));
    assert.ok(!/[<>]/.test(a.title), a.title);
    assert.ok(a.title.includes('Real headline'));
});
