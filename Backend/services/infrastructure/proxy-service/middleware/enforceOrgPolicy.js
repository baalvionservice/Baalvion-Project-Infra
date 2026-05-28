'use strict';

/**
 * Enforces organization policies on authenticated control-plane requests.
 * Runs AFTER requireOrganizationAccess (needs req.auth.organizationId + req.ip).
 * Currently enforces IP allowlist (immediate). MFA-required is enforced at the
 * login/SSO boundary; this also rejects if the org requires MFA and the session
 * is flagged non-MFA (req.auth.mfa === false).
 */

const orgPolicy = require('../service/orgPolicyService');
const enterpriseMetrics = require('../observability/enterpriseMetrics');
const { AppError } = require('../utils/errors');

async function enforceOrgPolicy(req, res, next) {
  try {
    const orgId = req.auth && req.auth.organizationId;
    if (!orgId) return next();
    const policies = await orgPolicy.getPolicies(orgId);

    if (policies.ip_allowlist && !orgPolicy.ipAllowed(policies, req.ip)) {
      enterpriseMetrics.incPolicyDenial('ip_allowlist');
      return next(new AppError('IP_NOT_ALLOWED', 'Your IP is not on the organization allowlist', 403));
    }
    if (orgPolicy.mfaRequired(policies) && req.auth.mfa === false) {
      enterpriseMetrics.incPolicyDenial('mfa_required');
      return next(new AppError('MFA_REQUIRED', 'Organization requires MFA', 403));
    }
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = enforceOrgPolicy;
