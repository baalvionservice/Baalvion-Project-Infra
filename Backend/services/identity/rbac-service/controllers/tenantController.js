'use strict';
const tenantService = require('../services/tenantService');
const { sendSuccess } = require('../utils/response');

const list = async (req, res) => {
    const data = await tenantService.listTenants({ type: req.query.type, parentId: req.query.parentId });
    sendSuccess(req, res, data);
};

const get = async (req, res) => {
    const t = await tenantService.getTenant(req.params.id);
    sendSuccess(req, res, tenantService.serialize(t));
};

const create = async (req, res) => {
    const t = await tenantService.createTenant(req.valid, req.auth?.userId);
    sendSuccess(req, res, t, 201);
};

module.exports = { list, get, create };
