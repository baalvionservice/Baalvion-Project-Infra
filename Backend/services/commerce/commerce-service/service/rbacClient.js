'use strict';
// Thin re-export — the RBAC HTTP client now lives in @baalvion/commerce-rbac and is constructed
// once in ./rbac. Kept as a module so existing `require('./rbacClient')` import paths are stable.
module.exports = require('./rbac').rbacClient;
