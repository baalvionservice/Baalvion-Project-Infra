'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/widgetController');

router.get('/:id', authMiddleware, ctrl.getWidget);
router.patch('/:id', authMiddleware, ctrl.updateWidget);
router.delete('/:id', authMiddleware, ctrl.deleteWidget);

module.exports = router;
