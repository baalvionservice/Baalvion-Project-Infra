'use strict';
/**
 * Internal CMS connector — snapshots CMS operational metrics straight from the
 * cms schema (no external API, no credentials). Feeds the "CMS Analytics" module:
 * content counts by status/type, drafts/scheduled/published/archived, average
 * publish latency, revision depth, and author/category totals.
 *
 * Runs as a daily snapshot (dims-keyed, granularity 'snapshot'), enqueued per
 * website by the maintenance job or on demand via the provider-sync endpoint.
 */
const { QueryTypes } = require('sequelize');

const num = (v) => (v == null ? 0 : Number(v));

module.exports = {
    id: 'internal_cms',
    provider: 'internal_cms',
    category: 'cms',
    requiredCreds: [],
    validate() { /* no credentials to validate */ },

    async sync({ website }) {
        const db = require('../models');
        const { sequelize } = db;
        const w = website.websiteId;
        const today = new Date().toISOString().slice(0, 10);
        const q = (sql) => sequelize.query(sql, { type: QueryTypes.SELECT, replacements: { w } });
        const snap = (metric, dims, value) => ({ metric, dims, value: num(value), granularity: 'snapshot', periodStart: today, periodEnd: today });

        const out = [];

        // Counts by workflow status.
        for (const r of await q(`SELECT status, count(*)::int AS n FROM cms.cms_contents WHERE website_id = :w GROUP BY status`)) {
            out.push(snap('content_by_status', { status: r.status }, r.n));
        }
        // Counts by content type.
        for (const r of await q(`SELECT content_type, count(*)::int AS n FROM cms.cms_contents WHERE website_id = :w GROUP BY content_type`)) {
            out.push(snap('content_by_type', { contentType: r.content_type }, r.n));
        }

        // Site totals (dims {}).
        const [t] = await q(`
            SELECT count(*)::int AS total,
                   count(*) FILTER (WHERE status = 'published')::int AS published,
                   count(*) FILTER (WHERE status = 'draft')::int AS draft,
                   count(*) FILTER (WHERE status = 'scheduled')::int AS scheduled,
                   count(*) FILTER (WHERE status = 'archived')::int AS archived,
                   COALESCE(round(avg(revision_count), 1), 0) AS avg_revisions
            FROM cms.cms_contents WHERE website_id = :w`);
        out.push(snap('content_total', {}, t.total));
        out.push(snap('content_published', {}, t.published));
        out.push(snap('content_draft', {}, t.draft));
        out.push(snap('content_scheduled', {}, t.scheduled));
        out.push(snap('content_archived', {}, t.archived));
        out.push(snap('avg_revisions', {}, t.avg_revisions));

        // Average publish latency (hours from creation to publish) over the last 90 days.
        const [lat] = await q(`
            SELECT COALESCE(round(avg(EXTRACT(EPOCH FROM (published_at - created_at)) / 3600.0)::numeric, 1), 0) AS hrs
            FROM cms.cms_contents
            WHERE website_id = :w AND status = 'published' AND published_at IS NOT NULL
              AND published_at >= now() - interval '90 days'`);
        out.push(snap('avg_publish_hours', {}, lat.hrs));

        // Author + category inventory.
        const [inv] = await q(`
            SELECT (SELECT count(*) FROM cms.cms_authors WHERE website_id = :w) AS authors,
                   (SELECT count(*) FROM cms.cms_categories WHERE website_id = :w) AS categories`);
        out.push(snap('authors', {}, inv.authors));
        out.push(snap('categories', {}, inv.categories));

        return out;
    },
};
