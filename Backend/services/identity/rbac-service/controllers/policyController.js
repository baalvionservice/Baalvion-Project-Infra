'use strict';
const policyService = require('../services/policyService');
const { sendSuccess } = require('../utils/response');

const list = async (req, res) => {
    const data = await policyService.listPolicies({ tenantId: req.query.tenantId, status: req.query.status, effect: req.query.effect });
    sendSuccess(req, res, data);
};

const get = async (req, res) => {
    const p = await policyService.getPolicy(req.params.id);
    sendSuccess(req, res, policyService.serialize(p));
};

const create = async (req, res) => {
    const p = await policyService.createPolicy(req.valid, req.auth?.userId);
    sendSuccess(req, res, p, 201);
};

const update = async (req, res) => {
    const p = await policyService.updatePolicy(req.params.id, req.valid, req.auth?.userId);
    sendSuccess(req, res, p);
};

const remove = async (req, res) => {
    const out = await policyService.deletePolicy(req.params.id);
    sendSuccess(req, res, out);
};

// ─── Subject attributes ────────────────────────────────────────────────────────
const setAttribute = async (req, res) => {
    const out = await policyService.setSubjectAttribute(req.params.userId, req.valid);
    sendSuccess(req, res, out, 201);
};

const getAttributes = async (req, res) => {
    const data = await policyService.getSubjectAttributes(req.params.userId, req.query.tenantId);
    sendSuccess(req, res, data);
};

module.exports = { list, get, create, update, remove, setAttribute, getAttributes };
