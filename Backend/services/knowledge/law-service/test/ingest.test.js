'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { parseFeed, parseFeedDate } = require('../service/ingest/feedParser');
const { runIngest } = require('../service/ingest/run');

const NOW = new Date('2026-09-21T15:00:00Z');
const iso = (hoursAgo) => new Date(NOW.getTime() - hoursAgo * 3600 * 1000).toISOString();

const atom = (entries) => `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom">${entries.map((e) => `<entry><title>${e.title}</title><link href="${e.link}" rel="alternate"/><published>${e.date}</published><author><name>Supreme Court of the United States</name></author><id>${e.link}</id><summary type="html">&lt;p&gt;Body text that must never be copied&lt;/p&gt;</summary></entry>`).join('')}</feed>`;
const rss = (items) => `<rss><channel>${items.map((i) => `<item><title>${i.title}</title><link>${i.link}</link><description>Body that must never be copied</description><pubDate>${i.date}</pubDate><guid isPermaLink="false">${i.guid}</guid></item>`).join('')}</channel></rss>`;

function fakeModel(existingKeys = []) {
    const rows = existingKeys.map((k) => ({ source_key: k }));
    return {
        rows,
        findAll: async ({ where }) => rows.filter((r) => where.source_key.includes(r.source_key)),
        create: async (row) => { rows.push(row); return row; },
    };
}
const feeds = (over = {}) => async (url) => {
    if (over[url] instanceof Error) throw over[url];
    if (over[url] !== undefined) return over[url];
    const host = new URL(url).hostname;
    if (host === 'www.courtlistener.com') return atom([
        { title: 'Postal Service v. California', link: 'https://www.courtlistener.com/opinion/111/postal-service-v-california/', date: iso(20) },
        { title: 'Ancient v. Case', link: 'https://www.courtlistener.com/opinion/222/ancient/', date: iso(400) },
    ]);
    if (host === 'www.uscourts.gov') return rss([{ title: 'Judiciary news item', link: 'http://www.uscourts.gov/news/a', date: '2026-09-21 09:00:00', guid: '9001' }]);
    if (host !== 'www.justice.gov') return rss([]);
    return rss([{ title: 'DOJ charges announced', link: 'https://www.justice.gov/opa/pr/x', date: new Date(NOW.getTime() - 2 * 3600 * 1000).toUTCString(), guid: 'doj-1' }]);
};

test('feeds parse to headline, link, id and date only, with entities decoded', () => {
    const [a] = parseFeed(atom([{ title: 'A &amp; B v. C', link: 'https://x.test/o/1', date: '2026-09-14T00:00:00-07:00' }]));
    assert.deepStrictEqual(Object.keys(a).sort(), ['author', 'date', 'id', 'link', 'title']);
    assert.strictEqual(a.title, 'A & B v. C');
    assert.throws(() => parseFeed('<html>not a feed</html>'));
});

test('a feed date with no offset is read as US Eastern time, daylight saving included', () => {
    assert.strictEqual(parseFeedDate('2026-09-17 12:00:00').toISOString(), '2026-09-17T16:00:00.000Z'); // EDT
    assert.strictEqual(parseFeedDate('2026-01-15 12:00:00').toISOString(), '2026-01-15T17:00:00.000Z'); // EST
});

test('ingest drafts unpublished candidates with no copied text and a 48 hour expiry', async () => {
    const model = fakeModel();
    const r = await runIngest({ Model: model, get: feeds(), now: NOW });
    assert.strictEqual(r.created, 3);
    for (const row of model.rows) {
        assert.strictEqual(row.published, false);
        assert.strictEqual(row.widget, 'breaking');
        assert.strictEqual(row.summary, '');
        assert.ok(row.url.startsWith('https://'), 'links are upgraded to https');
        assert.ok(row.source_key && row.source_name);
        assert.strictEqual(row.extra.region, 'US');
        assert.strictEqual(new Date(row.expires_at) - new Date(row.event_at), 48 * 3600 * 1000);
        assert.ok(!JSON.stringify(row).includes('must never be copied'));
    }
});

test('items too old are skipped and a second run creates nothing new', async () => {
    const model = fakeModel();
    const first = await runIngest({ Model: model, get: feeds(), now: NOW });
    assert.ok(first.tooOld >= 1);
    assert.ok(!model.rows.some((r) => r.title.includes('Ancient')));
    const second = await runIngest({ Model: model, get: feeds(), now: NOW });
    assert.strictEqual(second.created, 0);
    assert.strictEqual(second.alreadyKnown, 3);
});

test('an item an editor already archived is never drafted again', async () => {
    const model = fakeModel(['courtlistener:111']); // the archived row keeps its key
    const r = await runIngest({ Model: model, get: feeds(), now: NOW });
    assert.strictEqual(model.rows.filter((x) => x.source_key === 'courtlistener:111').length, 1);
    assert.strictEqual(r.created, 2);
});

test('every source is https, has a region, and a unique id', () => {
    const list = require('../service/ingest/sources').sources();
    assert.strictEqual(new Set(list.map((s) => s.id)).size, list.length);
    for (const s of list) { assert.ok(s.url.startsWith('https://'), s.id); assert.match(s.region, /^([A-Z]{2}|INTL)$/, s.id); }
});

test('each source declares the key prefix its own items really get, so per-country counts add up', () => {
    const sample = { id: 'https://www.courtlistener.com/opinion/5/x/', title: 'T', link: 'https://x.test/a', date: '2026-09-21T10:00:00Z', author: 'A' };
    for (const s of require('../service/ingest/sources').sources()) {
        assert.ok(s.candidate(sample).key.startsWith(`${s.keyPrefix}:`), s.id);
    }
});

test('one failing source is reported and does not stop the others', async () => {
    const model = fakeModel();
    const url = 'https://www.uscourts.gov/news/rss';
    const r = await runIngest({ Model: model, get: feeds({ [url]: new Error('HTTP 503') }), now: NOW });
    assert.strictEqual(r.sources.find((s) => s.id === 'uscourts-news').error, 'HTTP 503');
    assert.strictEqual(r.created, 2);
});

test('nested or encoded markup in a headline never survives as tags', () => {
    const feed = rss([{ title: '<<b>script>alert(1)</b> &lt;script&gt;x&lt;/script&gt; Real headline', link: 'https://x.test/a', date: '2026-09-21 09:00:00', guid: '1' }]);
    const [a] = parseFeed(feed);
    assert.ok(!/[<>]/.test(a.title), a.title);
    assert.ok(a.title.includes('Real headline'));
});
