const { AsyncLocalStorage } = require('async_hooks');

const tenantALS = new AsyncLocalStorage();

function tenantContext(req, res, next) {
  const tenantId = req.headers['x-tenant-id'] || req.user?.tenantId;

  if (!tenantId) {
    return res.status(400).json({
      error: 'MISSING_TENANT',
      message: 'x-tenant-id header required or must be in JWT',
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
