'use strict';
const router = require('express').Router();
const ctrl = require('../controller/aiController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/status', ctrl.status);
router.post('/asset-summary', ctrl.assetSummary);
// Reads back the caller's own in-progress draft text — requires auth (same bar as creating an
// article), unlike the two routes above which are anonymous-friendly by design.
router.post('/article-analysis', authMiddleware, ctrl.articleAnalysis);
// Explicit, user-triggered external originality check (never called automatically while
// typing — see the comment on originalityCheck in aiController.js).
router.post('/originality-check', authMiddleware, ctrl.originalityCheck);
// Explicit, user-triggered claim research (Prompt 3 Stage B — never called automatically
// while typing; see the comment on verifyClaims in aiController.js).
router.post('/verify-claims', authMiddleware, ctrl.verifyClaims);
// Explicit, user-triggered Full Editorial Audit (Prompt 4 — aggregates Prompts 1-3's already
// computed results; never called automatically while typing; see fullEditorialAudit in
// aiController.js).
router.post('/full-editorial-audit', authMiddleware, ctrl.fullEditorialAudit);

module.exports = router;
