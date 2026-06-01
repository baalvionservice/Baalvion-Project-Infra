const { AsyncLocalStorage } = require('async_hooks');

const tenantALS = new AsyncLocalStorage();

function tenantContext(req, res, next) {
  // Tenant comes ONLY from the verified principal (set by authMiddleware from the
  // JWT org claim) — NEVER from an untrusted x-tenant-id header. Mount AFTER auth.
  const tenantId = req.user?.tenantId || req.auth?.orgId;

  if (!tenantId) {
    return res.status(400).json({
      error: 'MISSING_TENANT',
      message: 'Tenant could not be resolved from the authenticated principal',
    });
  }

  tenantALS.run(tenantId, () => {
    req.tenantId = tenantId;
    next();
  });
}

function getTenantId() {
  return tenantALS.getStore();
}

module.exports = {
  tenantContext,
  getTenantId,
  tenantALS,
};
