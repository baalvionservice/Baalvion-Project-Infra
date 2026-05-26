'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/dataSourceController');

router.get('/', authMiddleware, ctrl.listDataSources);
router.post('/', authMiddleware, ctrl.createDataSource);
router.get('/:id', authMiddleware, ctrl.getDataSource);
router.patch('/:id', authMiddleware, ctrl.updateDataSource);
router.delete('/:id', authMiddleware, ctrl.deleteDataSource);
router.post('/:id/test', authMiddleware, ctrl.testConnection);

module.exports = router;
