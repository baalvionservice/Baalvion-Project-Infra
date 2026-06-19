'use strict';
// mergeParams so :collection from the catch-all mount is visible here.
const router = require('express').Router({ mergeParams: true });
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware');
const {
    listDocs, getDoc, createDoc, updateDoc, deleteDoc,
} = require('../controller/collectionController');

router.get('/',       optionalAuth, listDocs);
router.get('/:id',    optionalAuth, getDoc);
router.post('/',      authMiddleware, createDoc);
router.put('/:id',    authMiddleware, updateDoc);
router.patch('/:id',  authMiddleware, updateDoc);
router.delete('/:id', authMiddleware, deleteDoc);

module.exports = router;
