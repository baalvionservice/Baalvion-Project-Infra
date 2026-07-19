'use strict';
/**
 * Shared fetch helper against cms-service's public delivery API. Extracted
 * from service/glossarySyncService.js so both the glossary sync and
 * service/entityMentionDetectionService.js (both driven by the same
 * cms.content.published event, see workers/eventConsumer.js) share one fetch
 * implementation instead of duplicating it.
 */
const config = require('../config/appConfig');

async function fetchPublicContent(websiteSlug, slug) {
    const url = `${config.cms.baseUrl}/public/${encodeURIComponent(websiteSlug)}/content/${encodeURIComponent(slug)}`;
    const res = await fetch(url);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`cms-service public content fetch failed: ${res.status}`);
    const body = await res.json();
    return body && body.data ? body.data : body;
}

module.exports = { fetchPublicContent };
