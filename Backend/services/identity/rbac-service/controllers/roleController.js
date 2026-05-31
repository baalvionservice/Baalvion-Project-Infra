'use strict';
const roleService = require('../services/roleService');
const hierarchyService = require('../services/hierarchyService');
const { sendSuccess } = require('../utils/response');

const list = async (req, res) => {
    const data = await roleService.listRoles({
        tenantId: req.query.tenantId,
        scopeType: req.query.scopeType,
        key: req.query.key,
        includeSystem: req.query.includeSystem !== 'false',
    });
    sendSuccess(req, res, data);
};

const get = async (req, res) => {
    const r = await roleService.getRole(req.params.id);
    sendSuccess(req, res, roleService.serialize(r));
};

const create = async (req, res) => {
    const r = await roleService.createRole(req.valid, req.auth?.userId);
    sendSuccess(req, res, r, 201);
};

const update = async (req, res) => {
    const r = await roleService.updateRole(req.params.id, req.valid, req.auth?.userId);
    sendSuccess(req, res, r);
};

const remove = async (req, res) => {
    const r = await roleService.deleteRole(req.params.id);
    sendSuccess(req, res, r);
};

const setParent = async (req, res) => {
    const r = await roleService.setParent(req.params.id, req.valid.parentRoleId);
    sendSuccess(req, res, r);
};

const hierarchy = async (req, res) => {
    const tenantId = req.query.tenantId || req.params.tenantId;
    const data = await hierarchyService.getHierarchy(tenantId);
    sendSuccess(req, res, data);
};

module.exports = { list, get, create, update, remove, setParent, hierarchy };
