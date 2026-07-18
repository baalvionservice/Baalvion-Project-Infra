'use strict';
const { Router } = require('express');
const ctrl = require('../controller/catalogController');

const router = Router();

router.get('/catalog', ctrl.listCatalog);
router.get('/suppliers', ctrl.listSupplierStatus);

module.exports = router;
