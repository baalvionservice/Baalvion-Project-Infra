'use strict';
const router = require('express').Router();
const ctrl = require('../controller/affiliateController');
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware');

// optionalAuth so a staff bearer sees every status (see listAffiliateProducts); public callers
// still get the active-only list. Mutations require authMiddleware + the isPrivilegedCaller
// check inside the controller (staff-only, unlike article authorship).
router.get('/', optionalAuth, ctrl.listAffiliateProducts);
router.post('/', authMiddleware, ctrl.createAffiliateProduct);
// Must be registered before /:id so 'reports' isn't captured as an id param.
router.get('/reports/summary', authMiddleware, ctrl.getAffiliateReport);
router.get('/:id', authMiddleware, ctrl.getAffiliateProduct);
router.patch('/:id', authMiddleware, ctrl.updateAffiliateProduct);
router.delete('/:id', authMiddleware, ctrl.deleteAffiliateProduct);

module.exports = router;
