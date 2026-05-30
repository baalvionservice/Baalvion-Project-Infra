'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const db = require('../models');
const { makeSingleton } = require('../controller/engagementController');

const ctrl = makeSingleton(db.IrSetting);

// Platform settings are a singleton per org (the IR site). Public GET (branding/seo), authed PUT.
router.get('/', ctrl.get);
router.put('/', authMiddleware, ctrl.put);

module.exports = router;
