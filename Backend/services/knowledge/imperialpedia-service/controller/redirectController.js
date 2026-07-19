'use strict';
const crypto = require('crypto');
const db = require('../models');
const { AppError } = require('../utils/errors');

// SHA-256, never the raw IP — see migrations/20260004-create-affiliate-clicks.js.
const hashIp = (ip) => (ip ? crypto.createHash('sha256').update(ip).digest('hex') : null);

// GET /r/:trackingCode — public outbound affiliate redirect + click attribution.
// Mounted at the app root (not under /api/v1) so the link stays short — see index.js.
const redirectAffiliateClick = async (req, res, next) => {
    try {
        const product = await db.AffiliateProduct.findOne({
            where: { tracking_code: req.params.trackingCode, status: 'active' },
        });
        if (!product) return next(new AppError('NOT_FOUND', 'Link not found', 404));

        // Awaited, not fire-and-forget — this feeds commission attribution, so a lost write
        // here is a lost (potentially billable) event, unlike e.g. cms-service's view-count
        // recordContentView which can safely fail open.
        await db.AffiliateClick.create({
            product_id: product.id,
            user_id: (req.auth && req.auth.userId) || null,
            ip_hash: hashIp(req.ip),
            referrer_url: req.headers.referer || req.headers.referrer || null,
            user_agent: req.headers['user-agent'] || null,
        });
        await product.increment('clicks_count');

        return res.redirect(302, product.cta_url);
    } catch (err) { return next(err); }
};

module.exports = { redirectAffiliateClick };
