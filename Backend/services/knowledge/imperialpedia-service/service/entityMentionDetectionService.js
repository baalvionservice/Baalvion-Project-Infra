'use strict';
/**
 * Entity-linking detector — driven by the same cms.content.published /
 * cms.content.unpublished events as glossarySyncService.js (see
 * workers/eventConsumer.js), so it shares that service's redelivery-safety
 * reasoning: the write on the cms-service side is a full-replace, so a
 * redelivered event is a safe no-op.
 *
 * Scans an article's full body against this service's own entity+alias
 * catalog (company/industry/technology/country) — the catalog is local, so
 * the only cross-service call is fetching the published content and pushing
 * the small, already-resolved result list back to cms-service. No fabricated
 * matches: an entity is only ever included when its canonical name or an
 * explicitly-configured alias is found as a real whole-word mention in the
 * article's own prose (see utils/entityMentionText.js for what "prose" means
 * — headings/code/tables/images and existing links are excluded outright).
 */
const { Op } = require('sequelize');
const config = require('../config/appConfig');
const db = require('../models');
const { fetchPublicContent } = require('../utils/cmsClient');
const { extractTextSegments, findWholeWordMatch } = require('../utils/entityMentionText');

const LINKABLE_TYPES = ['company', 'industry', 'technology', 'country'];

// Route each entity type resolves to on the public site. Every route here
// must correspond to a real page — never add a type without confirming
// Frontend/Imperialpedia-main has a live /[type]/[slug] route for it first.
// Known drift risk: nothing automatically checks this map stays in sync with
// the frontend's actual route files (tracked as tech debt).
const ENTITY_TYPE_ROUTES = {
    company: '/companies/',
    industry: '/industries/',
    country: '/countries/',
    technology: '/technologies/',
};

function entityUrlFor(entity) {
    const base = ENTITY_TYPE_ROUTES[entity.type];
    return base ? `${base}${entity.slug}` : null;
}

/** Names to try for a given entity, canonical first, then each alias. */
function candidateNames(entity) {
    const aliases = Array.isArray(entity.aliases) ? entity.aliases.filter(Boolean) : [];
    return [entity.name, ...aliases];
}

/**
 * Builds the capped, self-link-excluded, no-fabrication list of entity
 * mentions for one piece of published content. Exported standalone (not just
 * via handlePublished) so it's independently testable.
 */
async function detectMentions(content) {
    const segments = extractTextSegments(content.contentBlocks);
    if (segments.length === 0) return [];

    const entities = await db.Entity.findAll({
        where: { type: { [Op.in]: LINKABLE_TYPES } },
        attributes: ['type', 'slug', 'name', 'aliases'],
        order: [['name', 'ASC']],
    });

    const primaryEntity = content.customFields && content.customFields.primaryEntity;

    const mentions = [];
    for (const entity of entities) {
        if (primaryEntity && primaryEntity.type === entity.type && primaryEntity.slug === entity.slug) {
            continue; // self-link prevention — never link an article to the entity it's about
        }
        const entityUrl = entityUrlFor(entity);
        if (!entityUrl) continue; // no real destination page for this type — never fabricate one

        let matchedText = null;
        for (const name of candidateNames(entity)) {
            matchedText = findWholeWordMatch(segments, name);
            if (matchedText) break;
        }
        if (!matchedText) continue;

        mentions.push({
            entityType: entity.type,
            entitySlug: entity.slug,
            entityName: entity.name,
            entityUrl,
            matchedText,
        });
    }

    // First-occurrence-only / one link per entity is already guaranteed (one row
    // per entity above) — this cap is the separate, configurable "max links per
    // article" anti-spam rule.
    return mentions.slice(0, config.entityLinking.maxLinksPerArticle);
}

async function pushMentions(websiteSlug, slug, mentions) {
    const url = `${config.cms.baseUrl}/internal/content/${encodeURIComponent(websiteSlug)}/${encodeURIComponent(slug)}/entity-mentions`;
    const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', 'x-internal-secret': config.internalSecret },
        body: JSON.stringify({ mentions }),
    });
    if (!res.ok) throw new Error(`cms-service entity-mentions write failed: ${res.status}`);
}

async function handlePublished(payload = {}) {
    const { websiteSlug, slug } = payload;
    if (!websiteSlug || !slug) return;
    if (!config.eventBus.allowedWebsiteSlugs.includes(websiteSlug)) return;

    const content = await fetchPublicContent(websiteSlug, slug);
    if (!content) return; // may already be unpublished again — harmless race

    const mentions = await detectMentions(content);
    await pushMentions(websiteSlug, slug, mentions);
}

async function handleUnpublished(payload = {}) {
    const { websiteSlug, slug } = payload;
    if (!websiteSlug || !slug) return;
    // Full-replace with an empty list clears any previously-linked mentions.
    await pushMentions(websiteSlug, slug, []);
}

module.exports = { detectMentions, handlePublished, handleUnpublished };
