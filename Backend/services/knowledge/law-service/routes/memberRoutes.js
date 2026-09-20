'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/memberController');

// Service-to-service; authenticated by x-service-key, not a user token.
router.post('/notify-followers', ctrl.notifyFollowers);

router.get('/follows',                     authMiddleware, ctrl.listFollows);
router.post('/follows',                    authMiddleware, ctrl.follow);
router.delete('/follows/:entityType/:slug', authMiddleware, ctrl.unfollow);
router.get('/saved',                       authMiddleware, ctrl.listSaved);
router.post('/saved',                      authMiddleware, ctrl.saveArticle);
router.delete('/saved/:slug',              authMiddleware, ctrl.unsaveArticle);
router.delete('/data',                     authMiddleware, ctrl.deleteMyData);

module.exports = router;
