'use strict';
const { Router } = require('express');
const svc = require('../service/buyerAccessService');
const { validate } = require('../middleware/validate');
const { sendSuccess } = require('../utils/response');
const { createPassSchema } = require('../validators/sellerBondSchemas');

const rolesOf = (req) => [req.auth.role, ...(Array.isArray(req.auth.roles) ? req.auth.roles : [])].filter(Boolean);
const wrap = (fn, status) => async (req, res, next) => {
    try { return sendSuccess(req, res, await fn(req), status); } catch (err) { return next(err); }
};

const router = Router();
router.get('/me', wrap((req) => svc.statusFor(req.auth.userId, rolesOf(req))));
router.post('/', validate(createPassSchema), wrap((req) => svc.startPass({ userId: req.auth.userId }, req.validated), 201));
module.exports = router;
