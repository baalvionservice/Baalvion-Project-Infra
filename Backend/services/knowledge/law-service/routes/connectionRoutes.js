'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/connectionController');

router.get('/feed',            authMiddleware, ctrl.feed);
router.get('/',                authMiddleware, ctrl.listConnections);
router.post('/',               authMiddleware, ctrl.sendRequest);
router.post('/:id/accept',     authMiddleware, ctrl.acceptRequest);
router.post('/:id/decline',    authMiddleware, ctrl.declineRequest);
router.delete('/:id',          authMiddleware, ctrl.removeConnection);

module.exports = router;
