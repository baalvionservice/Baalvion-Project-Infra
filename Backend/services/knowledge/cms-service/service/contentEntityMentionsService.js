'use strict';
/**
 * Write side of the entity-linking pipeline. Called only from the internal
 * PATCH endpoint (controller/internalEntityMentionsController.js), which
 * imperialpedia-service's service/entityMentionDetectionService.js hits on
 * every cms.content.published / cms.content.unpublished event. Always a
 * full-replace (destroy + bulkCreate) so a redelivered event is a safe no-op,
 * matching the same reasoning already used for the glossary sync integration.
 */
const { CmsWebsite, CmsContent, CmsContentEntityMention, sequelize } = require('../models');
const { AppError } = require('../utils/errors');
const cache = require('./cacheService');

async function replaceMentions(websiteSlug, slug, mentions = []) {
    const website = await CmsWebsite.findOne({ where: { slug: websiteSlug } });
    if (!website) throw new AppError('NOT_FOUND', 'Website not found', 404);

    const content = await CmsContent.findOne({ where: { websiteId: website.id, slug } });
    if (!content) throw new AppError('NOT_FOUND', 'Content not found', 404);

    const now = new Date();
    const rows = mentions.map((m) => ({
        contentId: content.id,
        entityType: m.entityType,
        entitySlug: m.entitySlug,
        entityName: m.entityName,
        entityUrl: m.entityUrl,
        matchedText: m.matchedText,
        status: m.status || 'accepted',
        source: m.source || 'auto',
        detectedAt: now,
    }));

    await sequelize.transaction(async (t) => {
        await CmsContentEntityMention.destroy({ where: { contentId: content.id }, transaction: t });
        if (rows.length > 0) await CmsContentEntityMention.bulkCreate(rows, { transaction: t });
    });

    // The article may already be cached (public delivery) without mentions —
    // bust it so the next read picks up this write.
    await cache.del(cache.keys.publicContent(websiteSlug, slug));

    return { contentId: content.id, count: rows.length };
}

module.exports = { replaceMentions };
