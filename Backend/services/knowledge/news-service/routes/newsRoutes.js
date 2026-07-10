'use strict';
const router = require('express').Router();
const ctrl = require('../controller/newsController');
const { apiKeyAuth } = require('../middleware/apiKeyAuth');
const { quota } = require('../middleware/quota');

router.use(apiKeyAuth, quota);

router.get('/', ctrl.listArticles);
router.get('/trending', ctrl.getTrending);
router.get('/:id', ctrl.getArticle);

module.exports = router;
