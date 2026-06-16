'use strict';
const db = require('../models');
const { sendSuccess } = require('../utils/response');

// Docs are read-only content (API reference, help articles, FAQ) served from the DB so they can be
// edited per tenant without a redeploy.
exports.get = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;
        const [apiCats, helpCats, articles, faqs] = await Promise.all([
            db.DocApiCategory.findAll({ where: { org_id: orgId }, order: [['sort_order', 'ASC']], raw: true }),
            db.DocHelpCategory.findAll({ where: { org_id: orgId }, order: [['sort_order', 'ASC']], raw: true }),
            db.DocHelpArticle.findAll({ where: { org_id: orgId }, order: [['last_updated', 'DESC']], raw: true }),
            db.DocFaq.findAll({ where: { org_id: orgId }, order: [['sort_order', 'ASC']], raw: true }),
        ]);
        return sendSuccess(req, res, {
            apiDocs: { categories: apiCats.map((c) => ({ name: c.name, endpoints: c.endpoints || [] })) },
            helpArticles: {
                categories: helpCats.map((c) => ({ slug: c.slug, name: c.name, description: c.description })),
                articles: articles.map((a) => ({
                    slug: a.slug, title: a.title, category: a.category,
                    readingTime: a.reading_time, lastUpdated: a.last_updated ? String(a.last_updated).slice(0, 10) : null,
                    content: a.content,
                })),
            },
            faq: faqs.map((f) => ({ question: f.question, answer: f.answer })),
        });
    } catch (err) { return next(err); }
};
