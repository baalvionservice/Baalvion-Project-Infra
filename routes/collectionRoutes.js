'use strict';
// mergeParams so :collection from the catch-all mount is visible here.
const router = require('express').Router({ mergeParams: true });
const { authMiddleware } = require('../middleware/authMiddleware');
const {
    listDocs, getDoc, createDoc, updateDoc, deleteDoc,
} = require('../controller/collectionController');

router.get('/',       listDocs);
router.get('/:id',    getDoc);
router.post('/',      authMiddleware, createDoc);
router.put('/:id',    authMiddleware, updateDoc);
router.patch('/:id',  authMiddleware, updateDoc);
router.delete('/:id', authMiddleware, deleteDoc);

module.exports = router;
