'use strict';
/**
 * Syncs short-titled CMS content (published via cms-service) into this service's
 * own `imperialpedia.entities` table as `type: 'term'` rows, so it renders in the
 * glossary at /terms/[letter]/[slug] without a manual admin step. Driven by the
 * cms.content.published / cms.content.unpublished domain events — see
 * workers/eventConsumer.js.
 */
const config = require('../config/appConfig');
const db = require('../models');
const { isGlossaryEligible, cmsBlocksToTermBlocks } = require('../utils/termBlockTransform');

const TERM_TYPE = 'term';

async function fetchPublicContent(websiteSlug, slug) {
    const url = `${config.cms.baseUrl}/public/${encodeURIComponent(websiteSlug)}/content/${encodeURIComponent(slug)}`;
    const res = await fetch(url);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`cms-service public content fetch failed: ${res.status}`);
    const body = await res.json();
    return body && body.data ? body.data : body;
}

async function handlePublished(payload = {}) {
    const { websiteSlug, slug } = payload;
    if (!websiteSlug || !slug) return;
    if (!config.eventBus.allowedWebsiteSlugs.includes(websiteSlug)) return;

    const content = await fetchPublicContent(websiteSlug, slug);
    if (!content) return; // may already be unpublished again — harmless race

    if (!isGlossaryEligible(content.title, config.glossarySync.maxWords)) return;

    const base = {
        type: TERM_TYPE,
        name: content.title,
        slug,
        description: content.excerpt || null,
        attributes: {
            title: content.title,
            content: cmsBlocksToTermBlocks(content.contentBlocks || []),
        },
    };

    const existing = await db.Entity.findOne({ where: { type: TERM_TYPE, slug } });
    if (existing) {
        await existing.update(base);
    } else {
        await db.Entity.create(base);
    }
}

async function handleUnpublished(payload = {}) {
    const { slug } = payload;
    if (!slug) return;
    await db.Entity.destroy({ where: { type: TERM_TYPE, slug } });
}

module.exports = { fetchPublicContent, handlePublished, handleUnpublished };
