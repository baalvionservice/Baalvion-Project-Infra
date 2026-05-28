'use strict';

/**
 * SCIM 2.0 endpoints (auth via scimAuth → req.scimOrg). Returns SCIM-shaped
 * resources/errors. Idempotent create; PATCH active=false → deprovision.
 */

const scim = require('../service/scimService');
const metrics = require('../observability/enterpriseMetrics');

const wrap = (h, op) => async (req, res) => {
  try {
    await h(req, res);
    metrics.incScimSync(op, 'ok');
  } catch (e) {
    metrics.incScimSync(op, 'error');
    const status = e.status || 500;
    res.status(status).json(e.scim || { schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'], status: String(status), detail: e.message });
  }
};

module.exports = {
  listUsers: wrap(async (req, res) => res.json(await scim.listUsers(req.scimOrg, { filter: req.query.filter, startIndex: req.query.startIndex, count: req.query.count })), 'list'),
  getUser: wrap(async (req, res) => {
    const u = await scim.getUser(req.scimOrg, req.params.id);
    if (!u) return res.status(404).json({ schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'], status: '404', detail: 'not found' });
    res.json(u);
  }, 'get'),
  createUser: wrap(async (req, res) => res.status(201).json(await scim.createUser(req.scimOrg, req.body)), 'create'),
  putUser: wrap(async (req, res) => res.json(await scim.patchUser(req.scimOrg, req.params.id, { Operations: [{ op: 'replace', value: { active: req.body.active } }] })), 'update'),
  patchUser: wrap(async (req, res) => res.json(await scim.patchUser(req.scimOrg, req.params.id, req.body)), 'patch'),
  deleteUser: wrap(async (req, res) => { await scim.deleteUser(req.scimOrg, req.params.id); res.status(204).end(); }, 'delete'),
  createGroup: wrap(async (req, res) => res.status(201).json(await scim.syncGroup(req.scimOrg, req.body)), 'group_sync'),
  patchGroup: wrap(async (req, res) => res.json(await scim.syncGroup(req.scimOrg, req.body)), 'group_sync'),
};
