'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/caseController');
const notesCtrl = require('../controller/caseNoteController');
const tasksCtrl = require('../controller/caseTaskController');
const timeLogsCtrl = require('../controller/timeLogController');

router.get('/',                  authMiddleware, ctrl.listCases);
router.post('/',                 authMiddleware, ctrl.createCase);
router.get('/:id',               authMiddleware, ctrl.getCase);
router.patch('/:id',             authMiddleware, ctrl.updateCase);
router.patch('/:id/status',      authMiddleware, ctrl.updateCaseStatus);
router.post('/:id/assign',       authMiddleware, ctrl.assignLawyer);

router.get('/:id/notes',            authMiddleware, notesCtrl.listNotes);
router.post('/:id/notes',           authMiddleware, notesCtrl.createNote);
router.delete('/:id/notes/:noteId', authMiddleware, notesCtrl.deleteNote);

router.get('/:id/tasks',            authMiddleware, tasksCtrl.listTasks);
router.post('/:id/tasks',           authMiddleware, tasksCtrl.createTask);
router.patch('/:id/tasks/:taskId',  authMiddleware, tasksCtrl.updateTaskStatus);

router.get('/:id/timelogs',         authMiddleware, timeLogsCtrl.listTimeLogs);
router.post('/:id/timelogs',        authMiddleware, timeLogsCtrl.createTimeLog);

module.exports = router;
