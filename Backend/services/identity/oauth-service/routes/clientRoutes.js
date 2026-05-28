'use strict';
const router = require('express').Router();
const ctrl   = require('../controller/clientController');

router.get('/',                        ctrl.listClients);
router.post('/',                       ctrl.createClient);
router.post('/:clientId/rotate',       ctrl.rotateSecret);
router.delete('/:clientId',            ctrl.deleteClient);

module.exports = router;
