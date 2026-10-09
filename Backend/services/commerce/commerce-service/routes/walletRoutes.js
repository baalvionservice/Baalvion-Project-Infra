'use strict';
const { Router } = require('express');
const svc = require('../service/walletService');
const { validate } = require('../middleware/validate');
const { requirePlatformAdmin } = require('../middleware/commerceAccess');
const { sendSuccess } = require('../utils/response');
const { topupSchema } = require('../validators/sellerBondSchemas');

const wrap = (fn, status) => async (req, res, next) => {
    try { return sendSuccess(req, res, await fn(req), status); } catch (err) { return next(err); }
};

const router = Router();
router.get('/me', wrap((req) => svc.getWallet(req.auth.userId)));
router.post('/topups', validate(topupSchema), wrap((req) => svc.startTopup({ userId: req.auth.userId }, req.validated), 201));
router.get('/admin/receipts', requirePlatformAdmin, wrap((req) => svc.adminReceipts({ limit: req.query.limit })));
module.exports = router;
