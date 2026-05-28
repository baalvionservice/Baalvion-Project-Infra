'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/watchlistController');

router.get('/', authMiddleware, ctrl.listWatchlists);
router.post('/', authMiddleware, ctrl.createWatchlist);
router.get('/:id', authMiddleware, ctrl.getWatchlist);
router.patch('/:id', authMiddleware, ctrl.updateWatchlist);
router.delete('/:id', authMiddleware, ctrl.deleteWatchlist);
router.post('/:id/items', authMiddleware, ctrl.addItem);
router.delete('/:id/items/:symbol', authMiddleware, ctrl.removeItem);

module.exports = router;
