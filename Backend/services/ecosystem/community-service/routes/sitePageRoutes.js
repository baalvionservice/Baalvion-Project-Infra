'use strict';
const { Router } = require('express');
const svc = require('../service/sitePageService');
const v = require('../validators/sitePage');
const { authMiddleware } = require('../middleware/authMiddleware');
const { rememberContact } = require('../middleware/rememberContact');
const { requirePerm } = require('../middleware/staffAccess');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

const router = Router();
const authMw = [authMiddleware, rememberContact];
const h = (fn) => async (req, res, next) => { try { return sendSuccess(req, res, await fn(req)); } catch (err) { return next(err); } };

// Public: the page's written content, and which pages have any (for the sitemap).
router.get('/pages', h((req) => (req.query.slug ? svc.get(req.query.slug) : svc.list())));
router.get('/admin/pages', ...authMw, requirePerm('content.manage'), h((req) => (req.query.slug ? svc.get(req.query.slug) : svc.list())));
router.put('/admin/pages', ...authMw, requirePerm('content.manage'), h((req) => {
    const r = v.pageSchema.safeParse(req.body || {});
    if (!r.success) throw new AppError('VALIDATION_ERROR', `${r.error.issues[0].path.join('.') || 'body'}: ${r.error.issues[0].message}`, 422);
    return svc.save(req.auth.userId, r.data);
}));

module.exports = router;
