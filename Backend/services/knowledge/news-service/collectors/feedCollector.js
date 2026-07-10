'use strict';
const crypto = require('crypto');
const db = require('../models');
const { fetchFeed } = require('./feedParser');

const SUMMARY_MAX_LENGTH = 2000;

function dedupeHash(sourceId, title, link) {
    return crypto.createHash('sha256').update(`${sourceId}:${title}:${link}`).digest('hex');
}

function normalizeItem(source, item) {
    const title = (item.title || '').trim();
    const url = item.link;
    if (!title || !url) return null;

    return {
        source_id: source.id,
        external_guid: item.guid || url,
        title,
        url,
        summary_raw: item.summary ? item.summary.slice(0, SUMMARY_MAX_LENGTH) : null,
        published_at: item.publishedAt ? new Date(item.publishedAt) : new Date(),
        country: source.country,
        language: source.language,
        category: source.default_category,
        dedupe_hash: dedupeHash(source.id, title, url),
        raw_payload: item,
    };
}

// Fetches and normalizes one source's RSS/Atom feed, then upserts new items.
// `press_release` and `government` sources are polled through the exact same path
// as `rss` sources — they're a classification tag, not a different mechanism (see
// migrations/20260702-create-news-sources.js).
async function collectFromSource(source) {
    const rawItems = await fetchFeed(source.feed_url);
    const items = rawItems.map((item) => normalizeItem(source, item)).filter(Boolean);

    let created = 0;
    for (const item of items) {
        const [, wasCreated] = await db.Article.findOrCreate({
            where: { dedupe_hash: item.dedupe_hash },
            defaults: item,
        });
        if (wasCreated) created += 1;
    }

    await source.update({ last_polled_at: new Date() });
    return { sourceId: source.id, fetched: items.length, created };
}

module.exports = { collectFromSource };
