'use strict';
const { Router } = require('express');
const ctrl = require('../controller/taskController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = Router();

router.get('/', authMiddleware, ctrl.listTasks);
router.post('/', authMiddleware, ctrl.createTask);
router.get('/:id', authMiddleware, ctrl.getTask);
router.patch('/:id', authMiddleware, ctrl.updateTask);
router.post('/:id/comments', authMiddleware, ctrl.addComment);

module.exports = router;
