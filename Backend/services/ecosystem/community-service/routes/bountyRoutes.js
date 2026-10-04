'use strict';
const { Router } = require('express');
const ctrl = require('../controller/bountyController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { AppError } = require('../utils/errors');
const { rememberContact } = require('../middleware/rememberContact');
const { requirePerm } = require('../middleware/staffAccess');
const userRateLimit = require('../middleware/userRateLimit');

const router = Router();
const baseAuth = authMiddleware;
const authMw = [baseAuth, rememberContact];
const adminAuth = [authMw];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
router.param('id', (req, res, next, id) => (UUID.test(id) ? next() : next(new AppError('NOT_FOUND', 'Not found', 404))));

// Everything here needs a session: task targets are not public information.
router.get('/bounty/status', authMw, ctrl.status);
router.post('/bounty/accept', authMw, ctrl.accept);
router.get('/bounty/tasks', authMw, ctrl.tasks);
router.post('/bounty/reports', authMw, ctrl.submitReport);
router.get('/bounty/reports/mine', authMw, ctrl.myReports);
router.get('/bounty/thread', authMw, ctrl.myThread);
const chatLimit = userRateLimit({ windowMs: 60 * 1000, max: 20 });
router.post('/bounty/thread', authMw, chatLimit, ctrl.postMyMessage);
router.get('/bounty/unread', authMw, ctrl.unread);

router.get('/admin/bounty/tasks', ...adminAuth, requirePerm('bounty.manage'), ctrl.adminTasks);
router.post('/admin/bounty/tasks', ...adminAuth, requirePerm('bounty.manage'), ctrl.adminCreateTask);
router.patch('/admin/bounty/tasks/:id', ...adminAuth, requirePerm('bounty.manage'), ctrl.adminUpdateTask);
router.get('/admin/bounty/reports', ...adminAuth, requirePerm('bounty.manage'), ctrl.adminReports);
router.patch('/admin/bounty/reports/:id', ...adminAuth, requirePerm('bounty.manage'), ctrl.adminReviewReport);
router.get('/admin/bounty/threads', ...adminAuth, requirePerm('bounty.manage'), ctrl.adminThreads);
router.get('/admin/bounty/threads/:id', ...adminAuth, requirePerm('bounty.manage'), ctrl.adminThread);
router.post('/admin/bounty/threads/:id', ...adminAuth, requirePerm('bounty.manage'), ctrl.adminReply);

module.exports = router;
