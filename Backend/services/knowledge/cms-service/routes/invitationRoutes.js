'use strict';
const { Router } = require('express');
const ctrl = require('../controller/invitationController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const { acceptInvitationSchema } = require('../validators/invitationSchemas');

const router = Router();

// Public — token-authenticated invitation lookup (recipient has no session yet).
router.get('/:token', ctrl.getPublic);

// Authenticated — the recipient's session (from auth-service register/login,
// established just before this call) proves email ownership.
router.post('/:token/accept', authMiddleware, validate(acceptInvitationSchema), ctrl.accept);

module.exports = router;
