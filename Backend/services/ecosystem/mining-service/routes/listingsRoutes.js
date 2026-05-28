'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/listingsController');

router.get('/', ctrl.listListings);
router.post('/', authMiddleware, ctrl.createListing);
router.get('/:id', ctrl.getListing);
router.patch('/:id', authMiddleware, ctrl.updateListing);
router.delete('/:id', authMiddleware, ctrl.deleteListing);
router.post('/:id/publish', authMiddleware, ctrl.publishListing);
router.post('/:id/feature', authMiddleware, ctrl.featureListing);

module.exports = router;
