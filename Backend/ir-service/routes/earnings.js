'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/earningsController');

router.get('/', ctrl.listEarnings);
router.post('/', authMiddleware, ctrl.createEarnings);
router.get('/:id', ctrl.getEarnings);
router.patch('/:id', authMiddleware, ctrl.updateEarnings);
router.get('/:id/transcript', authMiddleware, ctrl.getTranscript);

module.exports = router;
