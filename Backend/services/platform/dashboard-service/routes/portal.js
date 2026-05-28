'use strict';
const { Router } = require('express');
const ctrl = require('../controller/portalController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = Router();

// Public endpoint — no authMiddleware (uses token + PIN auth)
router.post('/auth', ctrl.portalAuth);

// Admin endpoint to provision portal access
router.post('/access', authMiddleware, ctrl.createPortalAccess);

module.exports = router;
