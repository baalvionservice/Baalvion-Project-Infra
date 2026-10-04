'use strict';
const { Router } = require('express');
const svc = require('../service/mediaService');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/authMiddleware');
const { rememberContact } = require('../middleware/rememberContact');
const { resolveTier, can } = require('../middleware/staffAccess');
const userRateLimit = require('../middleware/userRateLimit');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

const router = Router();
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const uploadLimit = userRateLimit({ windowMs: 60 * 60 * 1000, max: 30, message: 'Too many uploads, try again later' });

router.post('/media', authMiddleware, rememberContact, uploadLimit, async (req, res, next) => {
    try {
        const { purpose, dataUrl } = req.body || {};
        const tier = await resolveTier(req);
        return sendSuccess(req, res, await svc.upload(req.auth.userId, can(tier, 'content.manage'), { purpose, dataUrl }), 201);
    } catch (err) { return next(err); }
});

// Public images need no login; restricted ones need a session that is allowed to see them.
router.get('/media/:id', optionalAuthMiddleware, async (req, res, next) => {
    try {
        if (!UUID.test(req.params.id)) throw new AppError('NOT_FOUND', 'Not found', 404);
        const tier = req.auth ? await resolveTier(req) : null;
        const row = await svc.loadForViewer(req.params.id, { userId: req.auth && req.auth.userId, isAdmin: !!tier });
        res.set({
            'Content-Type': row.mime,
            'X-Content-Type-Options': 'nosniff',
            'Content-Security-Policy': "default-src 'none'; sandbox",
            'Cross-Origin-Resource-Policy': 'cross-origin',
            'Cache-Control': row.visibility === 'public' ? 'public, max-age=31536000, immutable' : 'private, max-age=300',
        });
        return res.send(row.data);
    } catch (err) { return next(err); }
});

module.exports = router;
