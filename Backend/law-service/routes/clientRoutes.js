'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/clientController');

router.get('/',       authMiddleware, ctrl.listClients);
router.get('/me',     authMiddleware, ctrl.getMyProfile);
router.post('/',      authMiddleware, ctrl.createClient);
router.get('/:id',    authMiddleware, ctrl.getClient);
router.patch('/:id',  authMiddleware, ctrl.updateClient);
router.delete('/:id', authMiddleware, ctrl.deleteClient);

module.exports = router;
