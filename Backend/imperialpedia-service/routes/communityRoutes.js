const router = require('express').Router();
const ctrl = require('../controller/imperialpediaController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/posts', ctrl.listPosts);
router.post('/posts', authMiddleware, ctrl.createPost);
router.get('/posts/:id', ctrl.getPost);
router.patch('/posts/:id', authMiddleware, ctrl.updatePost);
router.delete('/posts/:id', authMiddleware, ctrl.deletePost);
router.post('/posts/:id/vote', authMiddleware, ctrl.voteOnPost);
router.get('/posts/:id/comments', ctrl.listComments);
router.post('/posts/:id/comments', authMiddleware, ctrl.addComment);

module.exports = router;
