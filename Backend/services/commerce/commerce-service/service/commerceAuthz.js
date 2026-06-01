'use strict';
// Thin re-export — the PEP "brain" (scope resolution) now lives in @baalvion/commerce-rbac.
// This preserves the prior commerceAuthz surface so storeService, rbacTenantSync and the
// provisioning script keep importing the same names. Only loadStoreScope is commerce-specific
// (DB-authoritative) and is provided by ./rbac.
const {
    COMMERCE_STORE_ROLES,
    RBAC_ROLE_TO_CAPABILITY,
    normCountry,
} = require('@baalvion/commerce-rbac');
const { scope, loadStoreScope } = require('./rbac');

module.exports = {
    COMMERCE_STORE_ROLES,
    RBAC_ROLE_TO_CAPABILITY,
    normCountry,
    loadStoreScope,
    getEffective: scope.getEffective,
    resolveStoreCapability: scope.resolveStoreCapability,
    resolveAccessScope: scope.resolveAccessScope,
    canAdministerCountry: scope.canAdministerCountry,
    resolveRoleIdByKey: scope.resolveRoleIdByKey,
    invalidateUser: scope.invalidateUser,
};
