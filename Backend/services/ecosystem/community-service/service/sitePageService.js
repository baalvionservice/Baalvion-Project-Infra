'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');

const present = (p) => ({
    slug: p.slug, title: p.title || '', seoTitle: p.seo_title || '', seoDescription: p.seo_description || '', intro: p.intro || '', body: p.body || '',
    benefits: p.benefits || [], faqs: p.faqs || [], image: p.image || '', noindex: !!p.noindex, updatedAt: p.updatedAt,
});
const clean = (slug) => String(slug || '').replace(/^\/+|\/+$/g, '').toLowerCase();

async function get(slug) {
    const p = await db.SitePage.findByPk(clean(slug));
    if (!p) throw new AppError('NOT_FOUND', 'No content for this page', 404);
    return present(p);
}

// Slugs and update times only, for the sitemap and the admin list.
async function list() {
    const rows = await db.SitePage.findAll({ attributes: ['slug', 'title', 'seo_title', 'noindex', 'updated_at'], order: [['slug', 'ASC']] });
    return { items: rows.map((p) => ({ slug: p.slug, title: p.title || '', hasSeo: !!p.seo_title, noindex: !!p.noindex, updatedAt: p.get('updated_at') })) };
}

async function save(userId, d) {
    const slug = clean(d.slug);
    const patch = {
        title: d.title || null, seo_title: d.seoTitle || null, seo_description: d.seoDescription || null, intro: d.intro || null, body: d.body || null,
        benefits: d.benefits || [], faqs: d.faqs || [], image: d.image || null, noindex: !!d.noindex, updated_by: String(userId),
    };
    const [row, created] = await db.SitePage.findOrCreate({ where: { slug }, defaults: { slug, ...patch } });
    if (!created) await row.update(patch);
    return present(row);
}

module.exports = { get, list, save };
