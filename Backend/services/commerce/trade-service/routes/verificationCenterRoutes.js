'use strict';
// Verification Center — mounted at /v1/verification_center (Phase 2 Trust/
// Verification/Compliance Foundation).
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const config = require('../config/appConfig');
const gate = require('../service/verification/gate');
const { sendSuccess } = require('../utils/response');
const ctrl = require('../controller/verificationCenterController');

/**
 * GET /verification_center/gate — what the CALLER may currently do.
 *
 * The gate refuses actions with a 403 that names what is missing; this lets the UI
 * say so before the user fills in a booking form, instead of after. Registered
 * before '/:orgId' so 'gate' is not read as an org id.
 */
router.get('/gate', authMiddleware, async (req, res, next) => {
    try {
        const state = await gate.levelFor({
            orgId: req.auth.orgId, userId: req.auth.userId, tenantId: req.auth.tenantId,
        });
        const required = config.verification.requiredLevel;
        return sendSuccess(req, res, {
            ...state,
            required,
            enforced: config.verification.enforce,
            canCommit: !config.verification.enforce || gate.rank(state.level) >= gate.rank(required),
        });
    } catch (err) { return next(err); }
});

router.get('/:orgId', authMiddleware, ctrl.getVerificationCenter);

module.exports = router;
