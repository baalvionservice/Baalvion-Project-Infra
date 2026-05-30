'use strict';
const router = require('express').Router();
const ctrl = require('../controller/entitiesController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Public read
router.get('/', ctrl.listEntities);
router.get('/:type/:slug', ctrl.getEntity);

// Admin write
router.post('/', authMiddleware, ctrl.upsertEntity);
router.delete('/:type/:slug', authMiddleware, ctrl.deleteEntity);

module.exports = router;
