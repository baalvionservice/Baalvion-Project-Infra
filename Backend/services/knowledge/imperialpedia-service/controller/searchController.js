'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { sendSuccess } = require('../utils/response');

// GET /search?q=&limit= — public unified search across entities, creators, and assets.
const search = async (req, res, next) => {
    try {
        const q = (req.query.q || '').trim();
        if (!q) return sendSuccess(req, res, []);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 30));
        const like = `%${q}%`;

        const [entities, creators, assets] = await Promise.all([
            db.Entity.findAll({
                where: { [Op.or]: [{ name: { [Op.iLike]: like } }, { description: { [Op.iLike]: like } }] },
                limit,
                order: [['name', 'ASC']],
            }),
            db.CreatorProfile.findAll({ where: { display_name: { [Op.iLike]: like } }, limit: 8 }),
            db.AssetSummary.findAll({
                where: { [Op.or]: [{ symbol: { [Op.iLike]: like } }, { name: { [Op.iLike]: like } }] },
                limit: 8,
            }),
        ]);

        const results = [
            ...entities.map((e) => ({ type: e.type, slug: e.slug, name: e.name, description: e.description || '', category: e.category || e.type })),
            ...creators.map((c) => ({ type: 'author', slug: (c.meta && c.meta.username) || String(c.user_id), name: c.display_name, description: c.bio || '', category: 'Creator' })),
            ...assets.map((a) => ({ type: 'asset', slug: a.symbol, name: `${a.symbol} · ${a.name}`, description: a.ai_summary || '', category: a.asset_type || 'Asset' })),
        ];

        return sendSuccess(req, res, results);
    } catch (err) { return next(err); }
};

module.exports = { search };
