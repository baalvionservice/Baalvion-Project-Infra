'use strict';

// SCIM 2.0 (mounted at /scim/v2). Bearer-token auth via scimAuth.
const express = require('express');
const scimAuth = require('../middleware/scimAuth');
const c = require('../controller/scimController');

const router = express.Router();

// IdPs send application/scim+json — ensure it's parsed.
router.use(express.json({ type: ['application/json', 'application/scim+json'], limit: '2mb' }));
router.use(scimAuth);

router.get('/Users', c.listUsers);
router.get('/Users/:id', c.getUser);
router.post('/Users', c.createUser);
router.put('/Users/:id', c.putUser);
router.patch('/Users/:id', c.patchUser);
router.delete('/Users/:id', c.deleteUser);

router.post('/Groups', c.createGroup);
router.patch('/Groups/:id', c.patchGroup);

module.exports = router;
