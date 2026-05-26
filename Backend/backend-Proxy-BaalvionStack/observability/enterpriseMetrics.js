'use strict';

// Enterprise platform Prometheus metrics. prom-client optional (no-op if absent).
let client = null;
try { client = require('prom-client'); } catch (_) { client = null; }

function counter(name, help, labels = []) {
  if (!client) return { inc: () => {} };
  return client.register.getSingleMetric(name) || new client.Counter({ name, help, labelNames: labels });
}

const ssoLogins = counter('sso_logins_total', 'SSO logins', ['type']);
const scimSync = counter('scim_sync_total', 'SCIM provisioning operations', ['operation', 'status']);
const rbacDenials = counter('rbac_denials_total', 'RBAC permission denials', []);
const policyDenials = counter('org_policy_denials_total', 'Org policy denials', ['policy']);
const slaViolations = counter('sla_violations_total', 'SLA period violations', []);
const auditExports = counter('audit_exports_total', 'Audit exports', ['format']);

module.exports = {
  enabled: Boolean(client),
  incSsoLogin: (type) => ssoLogins.inc({ type }),
  incScimSync: (operation, status) => scimSync.inc({ operation, status }),
  incRbacDenial: () => rbacDenials.inc(),
  incPolicyDenial: (policy) => policyDenials.inc({ policy }),
  incSlaViolation: () => slaViolations.inc(),
  incAuditExport: (format) => auditExports.inc({ format }),
};
