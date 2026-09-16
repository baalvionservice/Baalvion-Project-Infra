'use strict';
const db = require('../models');
const { cleanText, cleanBody } = require('../utils/sanitize');
const { notFound, conflict } = require('../utils/errors');

/**
 * The directory of outside help — legal aid, mediation services, counselling, safety
 * planning. Unpublished entries are invisible to everyone but the volunteers and
 * moderators who curate them, so a half-checked referral is never shown to someone in
 * difficulty.
 */
async function list({ page, pageSize, category, countryCode, includeUnpublished = false }) {
    const where = {};
    if (!includeUnpublished) where.is_published = true;
    if (category) where.category = category;
    if (countryCode) where.country_code = countryCode.toUpperCase();

    const { rows, count } = await db.Resource.findAndCountAll({
        where,
        order: [['category', 'ASC'], ['title', 'ASC']],
        limit: pageSize,
        offset: (page - 1) * pageSize,
    });
    return { items: rows.map(serialize), total: count };
}

async function getBySlug(slug, { includeUnpublished = false } = {}) {
    const row = await db.Resource.findOne({ where: { slug: slug.toLowerCase() } });
    if (!row || (!row.is_published && !includeUnpublished)) throw notFound('Resource');
    return serialize(row);
}

async function create(ctx, input) {
    const slug = input.slug.toLowerCase();
    if (await db.Resource.findOne({ where: { slug } })) throw conflict('That resource address is already taken.', { slug: ['taken'] });

    const row = await db.Resource.create({
        slug,
        title: cleanText(input.title),
        summary: cleanBody(input.summary),
        body: cleanBody(input.body),
        category: input.category,
        country_code: input.countryCode ? input.countryCode.toUpperCase() : null,
        region: cleanText(input.region),
        url: input.url || null,
        provider_name: cleanText(input.providerName),
        is_published: Boolean(input.isPublished),
        published_at: input.isPublished ? new Date() : null,
        created_by: ctx.actor.userId,
    });
    return serialize(row);
}

async function update(ctx, id, input) {
    const row = await db.Resource.findByPk(id);
    if (!row) throw notFound('Resource');

    const patch = {};
    if (input.title !== undefined) patch.title = cleanText(input.title);
    if (input.summary !== undefined) patch.summary = cleanBody(input.summary);
    if (input.body !== undefined) patch.body = cleanBody(input.body);
    if (input.category !== undefined) patch.category = input.category;
    if (input.countryCode !== undefined) patch.country_code = input.countryCode ? input.countryCode.toUpperCase() : null;
    if (input.region !== undefined) patch.region = cleanText(input.region);
    if (input.url !== undefined) patch.url = input.url;
    if (input.providerName !== undefined) patch.provider_name = cleanText(input.providerName);
    if (input.isPublished !== undefined) {
        patch.is_published = input.isPublished;
        patch.published_at = input.isPublished ? (row.published_at || new Date()) : null;
    }

    await row.update(patch);
    return serialize(row);
}

const serialize = (r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    summary: r.summary,
    body: r.body,
    category: r.category,
    countryCode: r.country_code,
    region: r.region,
    url: r.url,
    providerName: r.provider_name,
    isPublished: r.is_published,
    publishedAt: r.published_at,
    updatedAt: r.updated_at,
});

/** Enough to render a link: no body, so a related list stays small. */
const serializeCard = (r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    summary: r.summary,
    category: r.category,
    countryCode: r.country_code,
    providerName: r.provider_name,
    url: r.url,
});

module.exports = { list, getBySlug, create, update, serializeCard };
