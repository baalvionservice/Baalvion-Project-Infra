'use strict';
const { Router } = require('express');
const ctrl = require('../controller/employeeController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = Router();

router.get('/departments', authMiddleware, ctrl.getDepartments);
router.get('/attendance/summary', authMiddleware, ctrl.getAttendanceSummary);
router.get('/attendance', authMiddleware, ctrl.getAttendance);
router.get('/', authMiddleware, ctrl.listEmployees);
router.post('/', authMiddleware, ctrl.createEmployee);
router.get('/:id', authMiddleware, ctrl.getEmployee);
router.patch('/:id', authMiddleware, ctrl.updateEmployee);
router.delete('/:id', authMiddleware, ctrl.deleteEmployee);

module.exports = router;
