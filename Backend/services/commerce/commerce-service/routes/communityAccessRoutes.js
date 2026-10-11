'use strict';
const { Router } = require('express');
const svc = require('../service/communityAccessService');
const { validate } = require('../middleware/validate');
const { sendSuccess } = require('../utils/response');
const { startTierSchema } = require('../validators/sellerBondSchemas');

const wrap = (fn, status) => async (req, res, next) => {
    try { return sendSuccess(req, res, await fn(req), status); } catch (err) { return next(err); }
};

const router = Router();
router.get('/me', wrap((req) => svc.statusFor(req.auth.userId)));
router.post('/', validate(startTierSchema), wrap((req) => svc.start({ userId: req.auth.userId }, req.validated), 201));
module.exports = router;
