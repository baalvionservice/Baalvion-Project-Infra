'use strict';
// Use communityController (matches the community_posts model: status active/removed,
// category, votes, pinning, threaded comments). The imperialpediaController/-Service
// community handlers were a mismatched parallel impl (queried status='published').
const router = require('express').Router();
const ctrl = require('../controller/communityController');
const extra = require('../controller/communityExtraController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Debates + sentiment (public reads)
router.get('/debates', extra.listDebates);
router.get('/debates-leaderboard', extra.debateLeaderboard);
router.get('/debates/:id', extra.getDebate);
router.get('/sentiment', extra.listSentiment);

router.get('/posts', ctrl.listPosts);
router.post('/posts', authMiddleware, ctrl.createPost);
router.get('/posts/:id', ctrl.getPost);
router.patch('/posts/:id', authMiddleware, ctrl.updatePost);
router.delete('/posts/:id', authMiddleware, ctrl.deletePost);
router.post('/posts/:id/vote', authMiddleware, ctrl.votePost);
router.post('/posts/:id/pin', authMiddleware, ctrl.pinPost);
router.get('/posts/:id/comments', ctrl.listComments);
router.post('/posts/:id/comments', authMiddleware, ctrl.addComment);
router.post('/comments/:id/vote', authMiddleware, ctrl.voteComment);

module.exports = router;
