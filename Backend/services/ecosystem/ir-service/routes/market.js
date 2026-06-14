'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/marketController');

router.get('/', ctrl.get);                        // public read (stock widget)
router.put('/', authMiddleware, ctrl.update);     // admin manual update
router.post('/refresh', authMiddleware, ctrl.refresh); // admin pull from live feed

module.exports = router;
