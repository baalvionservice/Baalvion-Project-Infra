'use strict';
// Trend intake, offline: fake HTTP for Google/Wikipedia/Wikidata, and the models + charter stubbed in
// require.cache (the same approach as the other tests here), so no network, Postgres or Redis is needed.
const { test } = require('node:test');
const assert = require('node:assert');
const path = require('path');

const signals = [];
const stub = (rel, exports) => { require.cache[require.resolve(path.join(__dirname, rel))] = { id: rel, filename: rel, loaded: true, exports }; };
stub('../models', {
    CmsStorySignal: {
        findOne: async ({ where }) => signals.find((s) => s.websiteId === where.websiteId && s.url === where.url) || null,
        create: async (row) => { const r = { ...row, update: async (p) => Object.assign(r, p) }; signals.push(r); return r; },
    },
});
let charter = { covers: ['film', 'singer', 'actor', 'album', 'streaming'], excludes: [], wireCategories: ['Entertainment'] };
stub('../service/editorial/charterService.js', { requireCharter: async () => charter });

const { parseTrendsRss } = require('../service/editorial/trends/googleTrends');
const { classifyEntity } = require('../service/editorial/trends/entertainment');
const { fetchTrendArticles } = require('../service/editorial/trends');
const { runTrendIntake } = require('../service/editorial/trendIntakeService');

const claim = (id) => ({ mainsnak: { datavalue: { value: { id } } } });
const ent = (p31, p106, wikiTitle) => ({ claims: { P31: p31.map(claim), ...(p106 ? { P106: p106.map(claim) } : {}) }, descriptions: { en: { value: 'x' } }, sitelinks: wikiTitle ? { enwiki: { title: wikiTitle } } : {} });

const RSS = `<rss><channel>
  <item><title>adam sandler</title><ht:approx_traffic>500+</ht:approx_traffic><pubDate>Mon, 21 Sep 2026 05:10:00 -0700</pubDate>
    <ht:news_item><ht:news_item_title>Sandler &amp; co. announce &apos;new film&apos;</ht:news_item_title><ht:news_item_url>https://variety.example/a?x=1&amp;y=2</ht:news_item_url><ht:news_item_source>Variety</ht:news_item_source></ht:news_item>
    <ht:news_item><ht:news_item_title>Insecure link</ht:news_item_title><ht:news_item_url>http://plain.example/b</ht:news_item_url><ht:news_item_source>Plain</ht:news_item_source></ht:news_item>
  </item>
  <item><title>bitcoin</title><ht:approx_traffic>500+</ht:approx_traffic><pubDate>Mon, 21 Sep 2026 05:10:00 -0700</pubDate>
    <ht:news_item><ht:news_item_title>Bitcoin hits a high</ht:news_item_title><ht:news_item_url>https://cnbc.example/c</ht:news_item_url><ht:news_item_source>CNBC</ht:news_item_source></ht:news_item>
  </item></channel></rss>`;

const http = {
    getText: async () => RSS,
    getJson: async (url) => {
        if (url.includes('wbsearchentities')) return { search: [{ id: decodeURIComponent(url).includes('adam sandler') ? 'Q1' : 'Q2' }] };
        if (url.includes('wbgetentities')) return { entities: { Q1: ent(['Q5'], ['Q33999'], 'Adam Sandler'), Q2: ent(['Q4917'], null, 'Bitcoin') } };
        if (url.includes('pageviews/top')) throw new Error('no data');
        if (url.includes('page/summary')) return { title: 'Adam Sandler', extract: 'Adam Sandler is an American actor and comedian.', content_urls: { desktop: { page: 'https://en.wikipedia.org/wiki/Adam_Sandler' } } };
        throw new Error(`unexpected ${url}`);
    },
};

test('the Google feed parses to topic, time and https news links, with entities decoded', () => {
    const [sandler] = parseTrendsRss(RSS);
    assert.strictEqual(sandler.topic, 'adam sandler');
    assert.strictEqual(sandler.news.length, 1, 'the http:// link is dropped');
    assert.strictEqual(sandler.news[0].title, "Sandler & co. announce 'new film'");
    assert.strictEqual(sandler.news[0].url, 'https://variety.example/a?x=1&y=2');
});

test('entertainment is decided by Wikidata class, and a politician or a cryptocurrency is not entertainment', () => {
    assert.strictEqual(classifyEntity(ent(['Q5'], ['Q33999'])), 'person');   // actor
    assert.strictEqual(classifyEntity(ent(['Q11424'])), 'work');              // film
    assert.strictEqual(classifyEntity(ent(['Q215380'])), 'act');              // band
    assert.strictEqual(classifyEntity(ent(['Q5'], ['Q82955'])), null);        // politician
    assert.strictEqual(classifyEntity(ent(['Q4917'])), null);                 // cryptocurrency
});

test('only entertainment topics are kept, as headline-and-link items plus a cited Wikipedia background', async () => {
    const { articles, report } = await fetchTrendArticles({ geos: ['US'], http, wikiTop: true, tmdbKey: '', now: new Date('2026-09-21T13:00:00Z') });
    assert.deepStrictEqual(report.topics.map((t) => t.topic), ['Adam Sandler']);
    assert.strictEqual(report.tmdb.skipped, 'TMDB_API_KEY is not set');
    const news = articles.find((a) => a.source.name === 'Variety');
    assert.strictEqual(news.summary_raw, '', 'an outlet\'s text is never copied, only its headline and link');
    assert.strictEqual(news.country, 'US');
    const bg = articles.find((a) => a.source.name === 'Wikipedia');
    assert.strictEqual(bg.url, 'https://en.wikipedia.org/wiki/Adam_Sandler');
    assert.ok(!articles.some((a) => /Bitcoin/.test(a.title)));
});

test('trend intake scores signals with the charter: on-beat accepted, and an off-charter site sees why they were rejected', async () => {
    const run = (c) => { signals.length = 0; charter = c; return runTrendIntake('site-1', { geos: ['US'], fetchTrends: () => fetchTrendArticles({ geos: ['US'], http, wikiTop: true, tmdbKey: '', now: new Date() }) }); };
    const onBeat = await run({ covers: ['film', 'actor', 'comedian'], excludes: [], wireCategories: ['Entertainment'] });
    assert.ok(onBeat.accepted >= 1, 'the Wikipedia background mentions an actor, the headline a film');
    const offBeat = await run({ covers: ['mortgage', 'tax'], excludes: [], wireCategories: ['Finance'] });
    assert.strictEqual(offBeat.accepted, 0);
    assert.ok(signals.every((s) => s.decision === 'rejected' && s.rejectionReason), 'rejections keep their reason so the charter can be corrected');
    const again = await run({ covers: ['film', 'actor'], excludes: [], wireCategories: ['Entertainment'] });
    assert.strictEqual(again.created, signals.length, 'a fresh run records one signal per item');
});
