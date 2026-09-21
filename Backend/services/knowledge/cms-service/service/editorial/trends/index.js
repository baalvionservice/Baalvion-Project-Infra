'use strict';
const { fetchGoogleTrends, DEFAULT_GEOS } = require('./googleTrends');
const wiki = require('./wikimedia');
const { classifyEntity } = require('./entertainment');
const { fetchTmdbTrending } = require('./tmdb');
const defaultHttp = require('./http');

const WIKI_TOP_KEEP = 12;
const SUMMARY_MAX = 700;
const LOOKUP_CONCURRENCY = 6;

/**
 * Trending entertainment topics, shaped as the wire-style items the editorial pipeline already scores.
 *
 * Each kept topic yields: one item per related news headline (the outlet's own headline and link, never its text),
 * and one Wikipedia background item (its short summary, with the link kept for attribution). The pipeline's
 * brief stage then extracts only facts that cite one of those URLs and holds the story if it is too thin.
 * "Entertainment" is decided by Wikidata class (see entertainment.js), so it is a filter, not a guarantee.
 */
async function fetchTrendArticles({ geos = DEFAULT_GEOS, tmdbKey = process.env.TMDB_API_KEY || '', http = defaultHttp, now = new Date(), wikiTop = true } = {}) {
    const { getJson, getText } = http;
    const report = { google: { topics: 0, entertainment: 0, errors: [] }, wikipedia: { checked: 0, entertainment: 0, error: null }, tmdb: { items: 0, skipped: null, error: null }, topics: [] };
    const topics = new Map(); // wikidata id -> { title, kind, sources:Set, geos:Set, news:[], views }

    const remember = (qid, entity, extra) => {
        const kind = classifyEntity(entity);
        if (!kind) return false;
        const title = entity.sitelinks && entity.sitelinks.enwiki && entity.sitelinks.enwiki.title;
        if (!title) return false; // no English Wikipedia page: nothing to cite as background
        const t = topics.get(qid) || { qid, title, kind, description: (entity.descriptions && entity.descriptions.en && entity.descriptions.en.value) || '', sources: new Set(), geos: new Set(), news: [], views: 0, at: null };
        extra(t); topics.set(qid, t);
        return true;
    };

    // 1. Google Trends: resolve each trending phrase to a Wikidata entity, keep entertainment ones.
    const g = await fetchGoogleTrends({ geos, getText });
    report.google.errors = g.errors; report.google.topics = g.trends.length;
    const phraseToQid = new Map();
    const phrases = [...new Set(g.trends.map((t) => t.topic))];
    for (let i = 0; i < phrases.length; i += LOOKUP_CONCURRENCY) { // a few at a time: polite to Wikidata, and 50 in a row took over a minute
        await Promise.all(phrases.slice(i, i + LOOKUP_CONCURRENCY).map(async (p) => {
            try { phraseToQid.set(p, await wiki.searchWikidata(p, { getJson })); } catch { phraseToQid.set(p, null); }
        }));
    }
    const gEntities = await wiki.wikidataEntities([...phraseToQid.values()].filter(Boolean), { getJson }).catch(() => new Map());
    for (const t of g.trends) {
        const qid = phraseToQid.get(t.topic);
        if (qid && remember(qid, gEntities.get(qid), (x) => {
            x.sources.add('Google Trends'); x.geos.add(t.geo); x.at = x.at || t.at;
            for (const n of t.news) if (!x.news.some((m) => m.url === n.url)) x.news.push({ ...n, geo: t.geo, at: t.at });
        })) report.google.entertainment += 1;
    }

    // 2. Wikipedia most-read, kept only where Wikidata says entertainment.
    if (wikiTop) {
        try {
            const top = await wiki.topViewed({ getJson, now });
            report.wikipedia.checked = top.length;
            const ids = await wiki.wikidataIdsForTitles(top.map((a) => a.title), { getJson });
            const ents = await wiki.wikidataEntities([...ids.values()], { getJson });
            let kept = 0;
            for (const a of top) {
                const qid = ids.get(a.title);
                if (!qid || kept >= WIKI_TOP_KEEP) continue;
                if (remember(qid, ents.get(qid), (x) => { x.sources.add('Wikipedia most-read'); x.views = Math.max(x.views, a.views); })) kept += 1;
            }
            report.wikipedia.entertainment = kept;
        } catch (err) { report.wikipedia.error = String(err.message).slice(0, 120); }
    }

    // 3. TMDB (optional): a trending title becomes a topic only if Wikidata can place it too, so it has something to cite.
    try {
        const tm = await fetchTmdbTrending({ apiKey: tmdbKey, getJson });
        report.tmdb.skipped = tm.skipped; report.tmdb.items = tm.items.length;
        for (const it of tm.items) {
            const qid = await wiki.searchWikidata(it.topic, { getJson }).catch(() => null);
            if (!qid) continue;
            const e = (await wiki.wikidataEntities([qid], { getJson })).get(qid);
            remember(qid, e, (x) => { x.sources.add('TMDB trending'); x.tmdbUrl = it.url; });
        }
    } catch (err) { report.tmdb.error = String(err.message).slice(0, 120); }

    // 4. Shape into wire-style items.
    const articles = [];
    for (const t of topics.values()) {
        const topicKey = `trend:${t.title}`;
        const at = t.at || now;
        let bg = null;
        try { bg = await wiki.wikipediaSummary(t.title, { getJson }); } catch { /* the topic just has no background item */ }
        if (bg) articles.push({ title: bg.title, url: bg.url, summary_raw: bg.extract.slice(0, SUMMARY_MAX), source: { name: 'Wikipedia', type: 'rss' }, published_at: at, category: 'Entertainment', country: null, topicKey });
        for (const n of t.news) articles.push({ title: n.title, url: n.url, summary_raw: '', source: { name: n.source || 'News', type: 'rss' }, published_at: n.at || at, category: 'Entertainment', country: n.geo, topicKey });
        report.topics.push({ topic: t.title, kind: t.kind, sources: [...t.sources], countries: [...t.geos], newsLinks: t.news.length, hasBackground: !!bg });
    }
    return { articles, report };
}

module.exports = { fetchTrendArticles };
