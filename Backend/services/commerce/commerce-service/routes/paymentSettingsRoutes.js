'use strict';
const { Router } = require('express');
const { z } = require('zod');
const svc = require('../service/paymentSettingsService');
const { validate } = require('../middleware/validate');
const { requirePlatformAdmin } = require('../middleware/commerceAccess');
const { sendSuccess } = require('../utils/response');

const wrap = (fn) => async (req, res, next) => {
    try { return sendSuccess(req, res, await fn(req)); } catch (err) { return next(err); }
};

const router = Router();
// Any signed-in user may read how long a review takes; only a platform admin changes it.
router.get('/', wrap(async () => ({ reviewWaitMinutes: await svc.getReviewWaitMinutes(), min: svc.MIN_WAIT, max: svc.MAX_WAIT })));
router.put('/', requirePlatformAdmin, validate(z.object({ reviewWaitMinutes: z.number().int().min(svc.MIN_WAIT).max(svc.MAX_WAIT) })),
    wrap((req) => svc.setReviewWaitMinutes(req.auth.userId, req.validated.reviewWaitMinutes)));

module.exports = router;
