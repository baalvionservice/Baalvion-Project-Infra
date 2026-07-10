'use strict';
const router = require('express').Router();
const ctrl = require('../controller/newsController');
const { requireInternalKey } = require('../middleware/internalAuth');

// First-party wire feed for sibling platform services (e.g. Imperialpedia's
// /world page). No developer-key/quota — that flow is for third-party API
// consumers (see routes/newsRoutes.js).
router.use(requireInternalKey);

router.get('/', ctrl.listArticles);
router.get('/trending', ctrl.getTrending);

module.exports = router;
