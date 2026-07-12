'use strict';
const router = require('express').Router();
const sources = require('../controller/adminSourcesController');
const articles = require('../controller/adminArticlesController');
const news = require('../controller/newsController');
const stats = require('../controller/statsController');
const ai = require('../controller/adminAiController');
const images = require('../controller/adminImagesController');
const seo = require('../controller/adminSeoController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

router.use(authMiddleware, requireRole('admin', 'super_admin'));

router.get('/sources', sources.list);
router.post('/sources', sources.create);
router.patch('/sources/:id', sources.update);
router.delete('/sources/:id', sources.remove);

router.get('/articles', news.listArticles);
router.delete('/articles/:id', articles.remove);

router.get('/news/trending', news.getTrending);
router.get('/stats/overview', stats.getOverview);

router.get('/ai/overview', ai.getOverview);
router.post('/ai/enrich', ai.runEnrichment);
router.get('/images/overview', images.getOverview);
router.get('/seo/overview', seo.getOverview);

module.exports = router;
