'use strict';
/**
 * Server-side content-analytics events.
 *
 * Emitted from the CMS public delivery path (the same call site that increments
 * viewCount), so content analytics work without any frontend change and even for
 * non-JS clients/crawlers that never fire the first-party beacon. Fire-and-forget
 * and fully fail-open — a Redis blip or disabled module must never affect content
 * delivery latency or success.
 */
const ingestService = require('./ingestService');
const registry = require('./websiteRegistry');
const { logger } = require('../../platform/logger');

/**
 * Record a content view. `content` is the delivered CMS content JSON (has id,
 * slug, authorId, categoryId, contentType, and optionally category{name}).
 */
async function recordContentView(websiteSlug, content) {
    try {
        if (!content || !content.id) return;
        const site = await registry.resolve(websiteSlug);
        if (!registry.moduleEnabled(site, 'content')) return; // site/module disabled → skip

        await ingestService.ingestServerEvent({
            event: 'content_view',
            module: 'content',
            provider: 'internal_cms',
            websiteId: site.websiteId,
            organizationId: site.organizationId,
            page: content.slug ? `/${content.slug}` : null,
            metadata: {
                contentId: String(content.id),
                slug: content.slug || null,
                title: content.title || null,
                authorId: content.authorId != null ? String(content.authorId) : null,
                categoryId: content.categoryId != null ? String(content.categoryId) : null,
                categoryName: content.category && content.category.name ? content.category.name : null,
                contentType: content.contentType || null,
            },
        });
    } catch (err) {
        // Fail-open: content delivery must never break on an analytics hiccup.
        try { logger('analytics-content').debug({ err: err && err.message }, 'content view event skipped'); } catch { /* noop */ }
    }
}

module.exports = { recordContentView };
