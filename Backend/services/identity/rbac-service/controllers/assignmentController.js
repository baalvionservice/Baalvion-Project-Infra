'use strict';
const assignmentService = require('../services/assignmentService');
const { sendSuccess } = require('../utils/response');

const create = async (req, res) => {
    const a = await assignmentService.assignRole(req.valid, req.auth?.userId);
    sendSuccess(req, res, a, 201);
};

const revoke = async (req, res) => {
    const out = await assignmentService.revokeAssignment(req.params.id, req.auth?.userId);
    sendSuccess(req, res, out);
};

const list = async (req, res) => {
    const data = await assignmentService.listAssignments({
        userId: req.query.userId, roleId: req.query.roleId, tenantId: req.query.tenantId,
        scopeId: req.query.scopeId, status: req.query.status,
    });
    sendSuccess(req, res, data);
};

const userRoles = async (req, res) => {
    const data = await assignmentService.getUserRoles(req.params.userId, { scopeId: req.query.scopeId });
    sendSuccess(req, res, data);
};

const userEffective = async (req, res) => {
    const data = await assignmentService.getUserEffective(req.params.userId, { scopeId: req.query.scopeId });
    sendSuccess(req, res, data);
};

module.exports = { create, revoke, list, userRoles, userEffective };
