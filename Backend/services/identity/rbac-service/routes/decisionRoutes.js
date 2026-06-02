'use strict';
const express = require('express');
const ctrl = require('../controllers/decisionController');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, internalOrUser } = require('../middleware/authMiddleware');
const { validate } = require('../validators/schemas');

const router = express.Router();

// PDP. PEPs (other backends) may call with an internal key; users may ask about
// themselves. /simulate is a no-log dry run for policy authoring.
router.post('/authorize', internalOrUser, validate('authorize'), asyncHandler(ctrl.authorize));
router.post('/simulate', authenticate, validate('authorize'), asyncHandler(ctrl.simulate));

module.exports = router;
