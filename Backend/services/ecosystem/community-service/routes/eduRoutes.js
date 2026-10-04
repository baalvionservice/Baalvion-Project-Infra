'use strict';
const { Router } = require('express');
const ctrl = require('../controller/eduController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { AppError } = require('../utils/errors');
const { rememberContact } = require('../middleware/rememberContact');
const { requirePerm } = require('../middleware/staffAccess');

const router = Router();
const baseAuth = authMiddleware;
const authMw = [baseAuth, rememberContact];
const adminAuth = [authMw];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
router.param('id', (req, res, next, id) => (UUID.test(id) ? next() : next(new AppError('NOT_FOUND', 'Not found', 404))));

router.get('/edu/teachers', ctrl.listTeachers);
router.get('/edu/teachers/:id', ctrl.getTeacher);
router.get('/edu/sessions', ctrl.upcomingSessions);

router.get('/edu/teacher/me', authMw, ctrl.myTeacher);
router.put('/edu/teacher/me', authMw, ctrl.saveMyTeacher);
router.get('/edu/teacher/sessions', authMw, ctrl.mySessions);
router.post('/edu/teacher/sessions', authMw, ctrl.createSession);
router.patch('/edu/teacher/sessions/:id', authMw, ctrl.updateSession);
router.get('/edu/teacher/sessions/:id/enrollments', authMw, ctrl.sessionEnrollments);
router.patch('/edu/teacher/enrollments/:id', authMw, ctrl.decideEnrollment);

router.post('/edu/sessions/:id/enroll', authMw, ctrl.enroll);
router.get('/edu/enrollments/mine', authMw, ctrl.myEnrollments);
router.post('/edu/enrollments/:id/cancel', authMw, ctrl.cancelEnrollment);
router.post('/edu/teachers/:id/reviews', authMw, ctrl.reviewTeacher);

router.get('/admin/edu/teachers', ...adminAuth, requirePerm('verify.review'), ctrl.adminTeachers);
router.patch('/admin/edu/teachers/:id', ...adminAuth, requirePerm('verify.review'), ctrl.adminReviewTeacher);
router.get('/admin/edu/sessions', ...adminAuth, requirePerm('content.manage'), ctrl.adminSessions);
router.post('/admin/edu/sessions/:id/cancel', ...adminAuth, requirePerm('content.manage'), ctrl.adminCancelSession);

module.exports = router;
