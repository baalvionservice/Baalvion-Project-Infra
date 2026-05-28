'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/newsController');

router.get('/', ctrl.listNews);
router.post('/', authMiddleware, ctrl.createNews);

module.exports = router;
