'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const {
    listTasks, getTask, createTask, updateTask, completeTask, deleteTask,
} = require('../controller/taskController');

// Tasks are private per-org data (not marketplace-visible), so every route requires auth.
router.get('/',              authMiddleware, listTasks);
router.get('/:id',           authMiddleware, getTask);
router.post('/',             authMiddleware, createTask);
router.put('/:id',           authMiddleware, updateTask);
router.patch('/:id',         authMiddleware, updateTask);
router.patch('/:id/complete', authMiddleware, completeTask);
router.delete('/:id',        authMiddleware, deleteTask);

module.exports = router;
