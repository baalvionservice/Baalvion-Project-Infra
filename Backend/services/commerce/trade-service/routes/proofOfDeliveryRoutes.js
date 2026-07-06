'use strict';
// Shipment Tracking & Global Visibility Platform — proof-of-delivery capture.
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission, LOGISTICS_PERMISSIONS } = require('../middleware/permissions');
const c = require('../controller/proofOfDeliveryController');

const capture = requirePermission(LOGISTICS_PERMISSIONS.POD_CAPTURE);

router.get('/',    authMiddleware, c.list);
router.get('/:id', authMiddleware, c.get);
router.post('/:shipmentId/otp', authMiddleware, capture, c.issueOtp);
router.post('/',   authMiddleware, capture, c.capture);

module.exports = router;
