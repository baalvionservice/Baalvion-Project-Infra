'use strict';

/**
 * Admin orchestration control plane (mounted under /v1/admin, platform-admin
 * only). Exposes live provider health, routing policies, IP intelligence, geo
 * coverage, active sessions, ban analytics, and credential management.
 */

const svc = require('../service/orchestrationAdminService');
const { sendSuccess } = require('../utils/response');

const wrap = (h) => async (req, res, next) => {
  try { await h(req, res, next); } catch (err) { next(err); }
};

module.exports = {
  providerStates: wrap(async (req, res) => sendSuccess(req, res, await svc.listProviderStates())),

  setCredentials: wrap(async (req, res) => sendSuccess(req, res, await svc.setProviderCredentials(req.params.id, {
    usernameTemplate: req.body.usernameTemplate,
    password: req.body.password,
    apiToken: req.body.apiToken,
    usageApiUrl: req.body.usageApiUrl,
  }), 201)),

  // Decrypted provider config for gateway bootstrap (PROVIDERS_JSON). Sensitive —
  // already gated by requirePlatformAdmin on the router.
  exportConfigs: wrap(async (req, res) => sendSuccess(req, res, await svc.exportProviderConfigs())),

  listPolicies: wrap(async (req, res) => sendSuccess(req, res, await svc.listRoutingPolicies())),
  upsertPolicy: wrap(async (req, res) => sendSuccess(req, res, await svc.upsertRoutingPolicy(req.body))),

  ipIntelligence: wrap(async (req, res) => sendSuccess(req, res, await svc.listIpIntelligence(req.query))),
  geoCoverage: wrap(async (req, res) => sendSuccess(req, res, await svc.getGeoCoverage())),
  activeSessions: wrap(async (req, res) => sendSuccess(req, res, await svc.listActiveSessions(req.query))),
  banAnalytics: wrap(async (req, res) => sendSuccess(req, res, await svc.getBanAnalytics())),
};
