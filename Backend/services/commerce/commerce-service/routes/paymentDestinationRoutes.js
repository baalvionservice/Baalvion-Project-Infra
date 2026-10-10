'use strict';
const { Router } = require('express');
const svc = require('../service/paymentDestinationService');
const { validate } = require('../middleware/validate');
const { requirePlatformAdmin } = require('../middleware/commerceAccess');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { destinationSchema } = require('../validators/sellerBondSchemas');

// Changing where money is sent is the most sensitive action in the seller flow, so it is limited to
// super admins (country admins can review payments, but cannot redirect them).
const requireSuperAdmin = (req, res, next) => {
    const roles = [req.auth && req.auth.role, ...((req.auth && Array.isArray(req.auth.roles)) ? req.auth.roles : [])].filter(Boolean);
    if (!roles.includes('super_admin')) return next(new AppError('FORBIDDEN', 'Only a super admin can change payment addresses', 403));
    return next();
};

const wrap = (fn, status) => async (req, res, next) => {
    try { return sendSuccess(req, res, await fn(req), status); } catch (err) { return next(err); }
};

const router = Router();
router.get('/available', wrap(() => svc.listAvailable()));
router.get('/', requirePlatformAdmin, wrap(() => svc.listAdmin()));
router.get('/history', requirePlatformAdmin, wrap((req) => svc.history(req.query.limit)));
router.put('/:method', requireSuperAdmin, validate(destinationSchema), wrap((req) => svc.set(req.auth.userId, req.params.method.toUpperCase(), req.validated)));

module.exports = router;
