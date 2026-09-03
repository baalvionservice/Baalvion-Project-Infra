'use strict';
const { Router } = require('express');
const ctrl = require('../controller/campusController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = Router();

// ─── Public ──────────────────────────────────────────────────────────────────
// The only campus route without auth: an approved-placements showcase, already
// stripped to non-identifying fields by the controller.
router.get('/placements/public', ctrl.listPublicPlacements);

// ─── Colleges ────────────────────────────────────────────────────────────────
router.get('/colleges', authMiddleware, ctrl.listColleges);
router.post('/colleges', authMiddleware, ctrl.createCollege);
router.get('/colleges/:id', authMiddleware, ctrl.getCollege);
router.patch('/colleges/:id', authMiddleware, ctrl.updateCollege);
router.delete('/colleges/:id', authMiddleware, ctrl.deleteCollege);

// ─── Students ────────────────────────────────────────────────────────────────
router.get('/students', authMiddleware, ctrl.listStudents);
router.post('/students', authMiddleware, ctrl.createStudent);
router.get('/students/:id', authMiddleware, ctrl.getStudent);
router.patch('/students/:id', authMiddleware, ctrl.updateStudent);
router.delete('/students/:id', authMiddleware, ctrl.deleteStudent);

// ─── Placements ──────────────────────────────────────────────────────────────
router.get('/placements', authMiddleware, ctrl.listPlacements);
router.post('/placements', authMiddleware, ctrl.createPlacement);
router.patch('/placements/:id', authMiddleware, ctrl.updatePlacement);

// ─── AI Matching ─────────────────────────────────────────────────────────────
router.get('/matches', authMiddleware, ctrl.getAIMatches);

module.exports = router;
