'use strict';
// Tax ID Types config catalog — mounted at /v1/tax_id_types (Phase 2 Tax Verification).
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/taxIdTypeController');

router.get('/', authMiddleware, ctrl.listTaxIdTypes);

module.exports = router;
