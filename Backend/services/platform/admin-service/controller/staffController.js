'use strict';
const staff = require('../service/staffService');
const { sendSuccess, sendPaginated } = require('../utils/response');

const orgOf = (req) => req.auth.orgId;
const pageArgs = (q) => ({
    page:  Math.max(1, parseInt(q.page, 10) || 1),
    limit: Math.min(200, Math.max(1, parseInt(q.limit, 10) || 20)),
});

// Departments
exports.listDepartments   = async (req, res, next) => { try { sendSuccess(req, res, await staff.listDepartments(orgOf(req))); } catch (e) { next(e); } };
exports.createDepartment  = async (req, res, next) => { try { sendSuccess(req, res, await staff.createDepartment(orgOf(req), req.body), 201); } catch (e) { next(e); } };
exports.updateDepartment  = async (req, res, next) => { try { sendSuccess(req, res, await staff.updateDepartment(orgOf(req), req.params.id, req.body)); } catch (e) { next(e); } };
exports.deleteDepartment  = async (req, res, next) => { try { sendSuccess(req, res, await staff.deleteDepartment(orgOf(req), req.params.id)); } catch (e) { next(e); } };

// Teams
exports.listTeams  = async (req, res, next) => { try { sendSuccess(req, res, await staff.listTeams(orgOf(req), { departmentId: req.query.departmentId })); } catch (e) { next(e); } };
exports.createTeam = async (req, res, next) => { try { sendSuccess(req, res, await staff.createTeam(orgOf(req), req.body), 201); } catch (e) { next(e); } };
exports.updateTeam = async (req, res, next) => { try { sendSuccess(req, res, await staff.updateTeam(orgOf(req), req.params.id, req.body)); } catch (e) { next(e); } };

// Employees
exports.listEmployees = async (req, res, next) => {
    try {
        const { page, limit } = pageArgs(req.query);
        const { items, total } = await staff.listEmployees(orgOf(req), {
            page, limit,
            departmentId: req.query.departmentId, teamId: req.query.teamId,
            status: req.query.status, search: req.query.search,
        });
        sendPaginated(req, res, items, total, page, limit);
    } catch (e) { next(e); }
};
exports.getEmployee        = async (req, res, next) => { try { sendSuccess(req, res, await staff.getEmployee(orgOf(req), req.params.id)); } catch (e) { next(e); } };
exports.updateEmployee     = async (req, res, next) => { try { sendSuccess(req, res, await staff.updateEmployee(orgOf(req), req.params.id, req.body)); } catch (e) { next(e); } };
exports.deactivateEmployee = async (req, res, next) => { try { sendSuccess(req, res, await staff.deactivateEmployee(orgOf(req), req.params.id, req.body && req.body.reason)); } catch (e) { next(e); } };

// Invitations
exports.listInvitations = async (req, res, next) => {
    try {
        const { page, limit } = pageArgs(req.query);
        const { items, total } = await staff.listInvitations(orgOf(req), { page, limit, status: req.query.status });
        sendPaginated(req, res, items, total, page, limit);
    } catch (e) { next(e); }
};
exports.sendInvitation = async (req, res, next) => {
    try {
        const invitedBy = { id: req.auth.userId, name: req.auth.email || req.auth.name, email: req.auth.email };
        sendSuccess(req, res, await staff.sendInvitation(orgOf(req), req.body, invitedBy), 201);
    } catch (e) { next(e); }
};
exports.revokeInvitation = async (req, res, next) => { try { sendSuccess(req, res, await staff.revokeInvitation(orgOf(req), req.params.id)); } catch (e) { next(e); } };

// Public: accept an invitation (token-authenticated, no bearer)
exports.acceptInvitation = async (req, res, next) => {
    try {
        const { token, password, fullName } = req.body || {};
        sendSuccess(req, res, await staff.acceptInvitation(token, { password, fullName }));
    } catch (e) { next(e); }
};

// Onboarding
exports.getOnboarding        = async (req, res, next) => { try { sendSuccess(req, res, await staff.getOnboarding(orgOf(req), req.params.id)); } catch (e) { next(e); } };
exports.updateOnboardingStep = async (req, res, next) => { try { sendSuccess(req, res, await staff.updateOnboardingStep(orgOf(req), req.params.id, req.params.stepId, req.body && req.body.completed)); } catch (e) { next(e); } };

// Identity
exports.getIdentityPermissions    = async (req, res, next) => { try { sendSuccess(req, res, await staff.getIdentityPermissions(orgOf(req), req.params.id)); } catch (e) { next(e); } };
exports.updateIdentityPermissions = async (req, res, next) => { try { sendSuccess(req, res, await staff.updateIdentityPermissions(orgOf(req), req.params.id, req.body)); } catch (e) { next(e); } };
