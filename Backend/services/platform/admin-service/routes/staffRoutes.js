'use strict';
// Authenticated staff (HR) console routes. Mounted under /v1/staff AFTER the
// global authMiddleware. Org-scoped via req.auth.orgId; gated to super_admin to
// match the rest of the admin console.
const router = require('express').Router();
const ctrl   = require('../controller/staffController');
const { requireSuperAdmin } = require('../middleware/authMiddleware');
const { validateBody } = require('../middleware/validate');
const {
    createDepartmentSchema,
    updateEmployeeSchema,
    sendInvitationSchema,
} = require('../validation/staffSchemas');

router.use(requireSuperAdmin);

// Departments
router.get('/departments',         ctrl.listDepartments);
router.post('/departments',        validateBody(createDepartmentSchema), ctrl.createDepartment);
router.patch('/departments/:id',   ctrl.updateDepartment);
router.delete('/departments/:id',  ctrl.deleteDepartment);

// Teams
router.get('/teams',        ctrl.listTeams);
router.post('/teams',       ctrl.createTeam);
router.patch('/teams/:id',  ctrl.updateTeam);

// Employees
router.get('/employees',                    ctrl.listEmployees);
router.get('/employees/:id',                ctrl.getEmployee);
router.patch('/employees/:id',              validateBody(updateEmployeeSchema), ctrl.updateEmployee);
router.post('/employees/:id/deactivate',    ctrl.deactivateEmployee);

// Onboarding
router.get('/employees/:id/onboarding',           ctrl.getOnboarding);
router.patch('/employees/:id/onboarding/:stepId',  ctrl.updateOnboardingStep);

// Identity / permissions
router.get('/employees/:id/permissions',  ctrl.getIdentityPermissions);
router.put('/employees/:id/permissions',  ctrl.updateIdentityPermissions);

// Invitations
router.get('/invitations',        ctrl.listInvitations);
router.post('/invitations',       validateBody(sendInvitationSchema), ctrl.sendInvitation);
router.delete('/invitations/:id', ctrl.revokeInvitation);

module.exports = router;
