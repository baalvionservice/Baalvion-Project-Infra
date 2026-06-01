'use strict';
// Thin re-export — store authorization middleware now lives in @baalvion/commerce-rbac (shared
// by every commerce service). RBAC remains the single source of truth. Route files keep importing
// { loadStoreRole, loadAccessScope, requireStoreRole, STORE_ROLE_LEVEL } from here unchanged.
const { STORE_ROLE_LEVEL } = require('@baalvion/commerce-rbac');
const { pep } = require('../service/rbac');

module.exports = {
    loadStoreRole: pep.loadStoreRole,
    loadAccessScope: pep.loadAccessScope,
    requireStoreRole: pep.requireStoreRole,
    STORE_ROLE_LEVEL,
};
