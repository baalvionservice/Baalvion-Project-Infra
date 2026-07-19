'use strict';
const { CmsWebsite, CmsContent } = require('../models');
const { AppError } = require('../utils/errors');

// INTERNAL — bulk content feed for imperialpedia-service's knowledge-feed aggregator (the
// "Global Data Package" bulk API prototype — see its service/knowledgeFeedService.js). Unlike
// getPublicContent/listPublicContent in publicService.js, this returns full contentBlocks and is
// NOT premium-redacted: entitlement enforcement for the bulk feed happens ONCE at the
// aggregator's own endpoint (a data-package license check), not per item here. This must stay
// internal-secret-gated for exactly that reason — it would leak every premium article's full
// body to an anonymous caller if ever exposed publicly.
async function listContentFeed(websiteSlug, { limit = 50, offset = 0 } = {}) {
    const website = await CmsWebsite.findOne({ where: { slug: websiteSlug, status: 'active' } });
    if (!website) throw new AppError('NOT_FOUND', 'Website not found', 404);

    const boundedLimit = Math.min(200, Math.max(1, Number(limit) || 50));
    const boundedOffset = Math.max(0, Number(offset) || 0);

    const { rows, count } = await CmsContent.findAndCountAll({
        where: { websiteId: website.id, status: 'published', visibility: 'public' },
        order: [['publishedAt', 'DESC']],
        limit: boundedLimit,
        offset: boundedOffset,
    });

    return { items: rows.map((r) => r.toJSON()), total: count };
}

module.exports = { listContentFeed };
