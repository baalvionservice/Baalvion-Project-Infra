'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/complaintController');

router.get('/me',  authMiddleware, ctrl.listMyComplaints);
router.post('/',   authMiddleware, ctrl.createComplaint);

module.exports = router;
