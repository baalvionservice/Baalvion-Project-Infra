'use strict';
const { Router } = require('express');
const ctrl = require('../controller/portalsController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = Router();

router.get('/', authMiddleware, ctrl.get);
router.post('/', authMiddleware, ctrl.create);
router.delete('/:portalKey', authMiddleware, ctrl.remove);

module.exports = router;
