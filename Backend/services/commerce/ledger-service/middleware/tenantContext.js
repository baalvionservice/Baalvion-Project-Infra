const { AsyncLocalStorage } = require('async_hooks');

const tenantALS = new AsyncLocalStorage();

function tenantContext(req, res, next) {
  // authMiddleware resolves tenantId from the correct authoritative source for each
  // caller type: verified JWT claims (orgId/tenantId) for user auth, and the
  // x-tenant-id header for trusted internal service callers (isService=true).
  // Use only req.user.tenantId here — do NOT re-read the raw header independently,
  // as that would re-introduce the header-override bypass for JWT callers.
  const tenantId = req.user?.tenantId;

  if (!tenantId) {
    return res.status(400).json({
      error: 'MISSING_TENANT',
      message: 'Tenant could not be resolved from token claims or internal service headers',
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
