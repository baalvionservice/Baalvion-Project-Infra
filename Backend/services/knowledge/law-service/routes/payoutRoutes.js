'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/payoutController');

router.use(authMiddleware);

router.get('/balance',     ctrl.getMyBalance);
router.get('/',            ctrl.listPayouts);
router.post('/',           ctrl.requestPayout);
router.post('/:id/process', ctrl.processPayout); // admin-gated in controller

module.exports = router;
