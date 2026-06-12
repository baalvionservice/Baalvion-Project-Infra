'use strict';
const router = require('express').Router();

// All marketplace domains are wired to Postgres. Deal room, due diligence, term sheets,
// e-signatures and escrow are sub-resources of /deals (e.g. /deals/:dealId/nda,
// /documents, /due-diligence, /term-sheets, /signatures, /escrow). AI matching lives at
// /opportunities/recommended. Cap table is read at /companies/:id/cap-table.
router.use('/companies', require('../modules/companies/routes'));
router.use('/investors', require('../modules/investors/routes'));
router.use('/opportunities', require('../modules/opportunities/routes'));
router.use('/deals', require('../modules/deals/routes'));
router.use('/admin', require('../modules/admin/routes'));

module.exports = router;
