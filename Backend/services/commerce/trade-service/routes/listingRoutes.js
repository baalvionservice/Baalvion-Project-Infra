'use strict';
const router = require('express').Router();
const { authMiddleware, requireOrgType } = require('../middleware/authMiddleware');
const {
    listListings, getListing, createListing, updateListing, deleteListing,
} = require('../controller/listingController');

// Listing supply is a seller action — a buyer-org token could otherwise call this directly
// (the UI never showed it the button, but nothing on the API stopped it).
router.get('/',       listListings);
router.get('/:id',    getListing);
router.post('/',      authMiddleware, requireOrgType('seller'), createListing);
router.patch('/:id',  authMiddleware, requireOrgType('seller'), updateListing);
router.delete('/:id', authMiddleware, requireOrgType('seller'), deleteListing);

module.exports = router;
