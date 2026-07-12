'use strict';
// Real, rule-based SEO health audit over actual article rows — no external SEO API, no
// fabricated scores. Every finding below is a genuine computed check against real column
// data (title length, summary presence, image presence, duplicate titles).

const db = require('../models');

const TITLE_MIN = 30;
const TITLE_MAX = 70;
const SUMMARY_MIN = 50;

function auditArticle(article, duplicateTitles) {
    const issues = [];
    const titleLen = (article.title || '').length;
    if (titleLen < TITLE_MIN) issues.push({ code: 'title_too_short', message: `Title is ${titleLen} chars (recommended ${TITLE_MIN}-${TITLE_MAX})` });
    if (titleLen > TITLE_MAX) issues.push({ code: 'title_too_long', message: `Title is ${titleLen} chars (recommended ${TITLE_MIN}-${TITLE_MAX})` });
    if (!article.summary_raw || article.summary_raw.length < SUMMARY_MIN) issues.push({ code: 'summary_missing_or_short', message: 'No summary, or shorter than 50 characters' });
    if (!article.image_url) issues.push({ code: 'missing_image', message: 'No source image extracted from the feed' });
    if (duplicateTitles.has(article.title)) issues.push({ code: 'duplicate_title', message: 'Title matches another recent article — possible duplicate/syndication' });
    return issues;
}

/** Audits the most recent `limit` articles. Returns per-article issue lists plus an
 *  aggregate count by issue code, all derived from real rows — 0 issues is a real 0, not
 *  an omitted section. */
async function getAuditOverview(limit = 200) {
    const articles = await db.Article.findAll({
        order: [['ingested_at', 'DESC']],
        limit,
        attributes: ['id', 'title', 'url', 'summary_raw', 'image_url', 'category', 'published_at'],
    });

    const titleCounts = new Map();
    for (const a of articles) titleCounts.set(a.title, (titleCounts.get(a.title) || 0) + 1);
    const duplicateTitles = new Set(Array.from(titleCounts.entries()).filter(([, n]) => n > 1).map(([t]) => t));

    const perArticle = articles.map((a) => ({
        id: a.id,
        title: a.title,
        url: a.url,
        issues: auditArticle(a, duplicateTitles),
    }));

    const issueCounts = {};
    for (const { issues } of perArticle) {
        for (const issue of issues) issueCounts[issue.code] = (issueCounts[issue.code] || 0) + 1;
    }

    const clean = perArticle.filter((a) => a.issues.length === 0).length;

    return {
        articlesAudited: articles.length,
        cleanArticles: clean,
        issueCounts,
        flagged: perArticle.filter((a) => a.issues.length > 0).slice(0, 50),
    };
}

module.exports = { auditArticle, getAuditOverview };
