'use strict';

/**
 * Coverage — what the desk has actually published, by section and by region.
 *
 * The publication policy says what a desk intends to publish; this says what it
 * did. The gap between the two is the only reliable signal that coverage is
 * slipping, and without it a thin /world page is noticed by a reader before it
 * is noticed by an editor.
 *
 * Counted from cms_contents rather than from drafts, so hand-written pieces
 * count exactly as pipeline output does. A section nobody has filed to in days
 * is stale whoever was supposed to write it.
 */

const { Op } = require('sequelize');
const { CmsContent, CmsCategory } = require('../../models');
const policyService = require('./policyService');
const charterService = require('./charterService');

// The region categories the site's /world pages are built from. A story filed
// under one of these appears on that region page; anything else is topic-only.
const REGION_SLUGS = ['us', 'europe', 'asia', 'china', 'emerging'];

// Days without a piece before a section is called stale. Two, not one: a desk
// that publishes six a day across a dozen sections will legitimately skip a
// section for a day, and flagging that produces noise nobody acts on.
const STALE_AFTER_DAYS = 2;

const daysAgo = (n) => new Date(Date.now() - n * 24 * 3600 * 1000);

/**
 * Published items in the window, with their categories resolved to slugs.
 *
 * categoryIds is the full set an editor checked; categoryId is only the primary.
 * Coverage has to read the full set, because the region a story belongs to is
 * almost always a secondary category sitting beside its topic.
 */
async function publishedInWindow(websiteId, days) {
    const rows = await CmsContent.findAll({
        where: {
            websiteId,
            status: 'published',
            contentType: { [Op.in]: policyService.GOVERNED_TYPES },
            publishedAt: { [Op.gte]: daysAgo(days) },
        },
        attributes: ['id', 'title', 'slug', 'categoryId', 'categoryIds', 'publishedAt'],
        raw: true,
    });

    const categories = await CmsCategory.findAll({
        where: { websiteId },
        attributes: ['id', 'slug', 'name'],
        raw: true,
    });
    const slugById = new Map(categories.map((c) => [c.id, c.slug]));

    return rows.map((r) => {
        const ids = [
            ...(r.categoryId ? [r.categoryId] : []),
            ...(Array.isArray(r.categoryIds) ? r.categoryIds : []),
        ];
        return {
            ...r,
            slugs: [...new Set(ids.map((id) => slugById.get(id)).filter(Boolean))],
        };
    });
}

function bucket(items, slugs, pick) {
    const out = new Map(slugs.map((s) => [s, { slug: s, last24h: 0, last7d: 0, lastPublishedAt: null }]));
    const cutoff = daysAgo(1);

    for (const item of items) {
        for (const slug of pick(item)) {
            const row = out.get(slug);
            if (!row) continue;
            row.last7d += 1;
            const at = item.publishedAt ? new Date(item.publishedAt) : null;
            if (at && at >= cutoff) row.last24h += 1;
            if (at && (!row.lastPublishedAt || at > row.lastPublishedAt)) row.lastPublishedAt = at;
        }
    }
    return [...out.values()];
}

function withStatus(row, deadSlugs) {
    const ageDays = row.lastPublishedAt
        ? (Date.now() - new Date(row.lastPublishedAt).getTime()) / 86400000
        : null;

    let status;
    if (deadSlugs.has(row.slug)) status = 'no_route';
    else if (ageDays === null) status = 'empty';
    else if (ageDays > STALE_AFTER_DAYS) status = 'stale';
    else status = 'fresh';

    return {
        ...row,
        lastPublishedAt: row.lastPublishedAt ? row.lastPublishedAt.toISOString() : null,
        ageDays: ageDays === null ? null : Math.round(ageDays * 10) / 10,
        status,
    };
}

/**
 * Section and region coverage for one website.
 *
 * `sections` is every live category the policy could publish into; `regions` is
 * the five /world region categories. A category with no working public route is
 * reported as `no_route` rather than `empty` — the distinction matters, because
 * the fix for one is to write, and for the other is to restore a route.
 */
async function getCoverage(websiteId, { days = 7 } = {}) {
    await charterService.requireCharter(websiteId);
    const policy = await policyService.requirePolicy(websiteId);
    const dead = new Set(Array.isArray(policy.deadCategorySlugs) ? policy.deadCategorySlugs : []);

    const categories = await CmsCategory.findAll({
        where: { websiteId },
        attributes: ['slug', 'name'],
        raw: true,
    });

    const topicSlugs = categories.map((c) => c.slug).filter((s) => !REGION_SLUGS.includes(s));
    const items = await publishedInWindow(websiteId, days);

    const sections = bucket(items, topicSlugs, (i) => i.slugs)
        .map((r) => withStatus(r, dead))
        .sort((a, b) => b.last7d - a.last7d || a.slug.localeCompare(b.slug));

    const regions = bucket(items, REGION_SLUGS, (i) => i.slugs)
        // Region pages live at /world/<slug>, which resolves even when the bare
        // /<slug> category route does not — so the dead-route set does not apply.
        .map((r) => withStatus(r, new Set()))
        .sort((a, b) => b.last7d - a.last7d);

    const plan = (Array.isArray(policy.categoryMix) ? policy.categoryMix : []);
    const target = policyService.effectiveDailyTarget(policy);

    return {
        windowDays: days,
        publishedInWindow: items.length,
        dailyTarget: target,
        publishedLast24h: items.filter((i) => i.publishedAt && new Date(i.publishedAt) >= daysAgo(1)).length,
        sections,
        regions,
        // What the policy intends, so the screen can show plan against reality
        // rather than making the reader hold the policy in their head.
        plan: plan.map((m) => ({ slug: m.categorySlug, label: m.label, targetPct: m.targetPct })),
        staleAfterDays: STALE_AFTER_DAYS,
    };
}

module.exports = { getCoverage, REGION_SLUGS, STALE_AFTER_DAYS };
