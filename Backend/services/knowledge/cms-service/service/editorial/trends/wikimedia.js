'use strict';

const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));
const NOT_ARTICLE = /^(Main_Page|Special:|Wikipedia:|Portal:|Category:|File:|Help:|Talk:|Template:|User:|-$)/;
const pad = (n) => String(n).padStart(2, '0');
const WD = 'https://www.wikidata.org/w/api.php?format=json&origin=*';

/** Yesterday's most-read English Wikipedia articles (today's are not published yet). */
async function topViewed({ getJson, now = new Date(), limit = 300 }) {
    for (const back of [1, 2]) {
        const d = new Date(now.getTime() - back * 86400000);
        try {
            const j = await getJson(`https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikipedia/all-access/${d.getUTCFullYear()}/${pad(d.getUTCMonth() + 1)}/${pad(d.getUTCDate())}`);
            return ((j.items && j.items[0] && j.items[0].articles) || []).filter((a) => !NOT_ARTICLE.test(a.article)).slice(0, limit).map((a) => ({ title: a.article.replace(/_/g, ' '), views: a.views }));
        } catch { /* try the day before */ }
    }
    return [];
}

/** title -> Wikidata id, for up to any number of titles (50 per request). */
async function wikidataIdsForTitles(titles, { getJson }) {
    const map = new Map();
    for (const part of chunk(titles, 50)) {
        const j = await getJson(`https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageprops&ppprop=wikibase_item&redirects=1&titles=${encodeURIComponent(part.join('|'))}`);
        const pages = (j.query && j.query.pages) || {};
        const norm = new Map(((j.query && j.query.normalized) || []).map((n) => [n.to, n.from]));
        const redir = new Map(((j.query && j.query.redirects) || []).map((r) => [r.to, r.from]));
        for (const p of Object.values(pages)) {
            const id = p.pageprops && p.pageprops.wikibase_item;
            if (!id) continue;
            let from = p.title;
            if (redir.has(from)) from = redir.get(from);
            if (norm.has(from)) from = norm.get(from);
            map.set(from, id); map.set(p.title, id);
        }
    }
    return map;
}

/** Wikidata entities (claims, English description, English Wikipedia title) for a list of ids. */
async function wikidataEntities(qids, { getJson }) {
    const out = new Map();
    for (const part of chunk([...new Set(qids)], 50)) {
        const j = await getJson(`${WD}&action=wbgetentities&props=claims|sitelinks|descriptions|labels&languages=en&sitefilter=enwiki&ids=${part.join('|')}`);
        for (const [id, e] of Object.entries(j.entities || {})) if (e && !e.missing) out.set(id, e);
    }
    return out;
}

/** First Wikidata match for a free-text topic, or null. Deliberately the top hit only. */
async function searchWikidata(name, { getJson }) {
    const j = await getJson(`${WD}&action=wbsearchentities&language=en&limit=1&search=${encodeURIComponent(name)}`);
    return (j.search && j.search[0] && j.search[0].id) || null;
}

/** Wikipedia's own short summary (CC BY-SA, so the caller must keep the link). */
async function wikipediaSummary(title, { getJson }) {
    const j = await getJson(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`);
    const url = j.content_urls && j.content_urls.desktop && j.content_urls.desktop.page;
    return j.extract && url ? { title: j.title, extract: j.extract, url, description: j.description || '' } : null;
}

module.exports = { topViewed, wikidataIdsForTitles, wikidataEntities, searchWikidata, wikipediaSummary };
