'use strict';
const permissionService = require('../services/permissionService');
const { sendSuccess } = require('../utils/response');

const list = async (req, res) => {
    const data = await permissionService.listPermissions({ module: req.query.module, resource: req.query.resource });
    sendSuccess(req, res, data);
};

const create = async (req, res) => {
    const p = await permissionService.createPermission(req.valid);
    sendSuccess(req, res, p, 201);
};

const remove = async (req, res) => {
    const p = await permissionService.deletePermission(req.params.id);
    sendSuccess(req, res, p);
};

// ─── Role ⇄ Permission ─────────────────────────────────────────────────────────
const attach = async (req, res) => {
    const out = await permissionService.attachToRole(req.params.roleId, req.valid.permissionId, {
        effect: req.valid.effect, constraints: req.valid.constraints, actorId: req.auth?.userId,
    });
    sendSuccess(req, res, out, 201);
};

const detach = async (req, res) => {
    const out = await permissionService.detachFromRole(req.params.roleId, req.params.permissionId);
    sendSuccess(req, res, out);
};

const listForRole = async (req, res) => {
    const data = await permissionService.listRolePermissions(req.params.roleId);
    sendSuccess(req, res, data);
};

const effectiveForRole = async (req, res) => {
    const eff = await permissionService.getEffectivePermissions(req.params.roleId);
    sendSuccess(req, res, [...eff.values()]);
};

module.exports = { list, create, remove, attach, detach, listForRole, effectiveForRole };
