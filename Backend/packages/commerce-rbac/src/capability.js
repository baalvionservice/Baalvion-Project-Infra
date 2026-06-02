'use strict';
// Canonical commerce role/capability vocabulary — defined ONCE here and shared by every
// commerce service (commerce, order, inventory). RBAC is the source of truth for WHO holds a
// role WHERE; this maps an RBAC role key onto the 0–100 capability ladder that route guards
// (`requireStoreRole`) compare against. It is a translation table, never an authority.

// Store-team roles (RBAC custom roles, scope=organization, assigned at scope_id=storeId).
const COMMERCE_STORE_ROLES = Object.freeze([
    { key: 'store_admin',     name: 'Store Admin',        rbacLevel: 190, capability: 100, description: 'Full control of a single store, incl. team management.' },
    { key: 'product_manager', name: 'Product Manager',    rbacLevel: 170, capability: 80,  description: 'Manage the full product catalogue incl. publish and delete.' },
    { key: 'ops_manager',     name: 'Operations Manager', rbacLevel: 160, capability: 60,  description: 'Inventory, fulfilment and order operations.' },
    { key: 'seo_manager',     name: 'SEO Manager',        rbacLevel: 150, capability: 50,  description: 'SEO configuration and product content editing.' },
    { key: 'store_viewer',    name: 'Store Viewer',       rbacLevel: 110, capability: 20,  description: 'Read-only access to a single store.' },
]);

// RBAC role key → commerce capability level (0–100). Hierarchy roles map to full store admin
// within their scope; legacy local store-member keys are retained for in-flight consistency.
const RBAC_ROLE_TO_CAPABILITY = Object.freeze({
    super_admin: 100,
    country_admin: 100,
    organization_admin: 100,
    store_admin: 100,
    product_manager: 80,
    commerce_manager: 80,      // legacy alias
    ops_manager: 60,
    inventory_manager: 60,     // legacy
    fulfillment_manager: 50,   // legacy
    seo_manager: 50,
    content_editor: 40,        // legacy
    support_agent: 30,         // legacy
    store_viewer: 20,
    reviewer: 20,              // legacy
    end_user: 0,
});

// The threshold vocabulary route guards name, e.g. requireStoreRole('content_editor'). Each
// value is a level on the SAME 0–100 ladder. Kept aligned with RBAC_ROLE_TO_CAPABILITY.
const STORE_ROLE_LEVEL = Object.freeze({
    store_admin: 100,
    commerce_manager: 80,
    product_manager: 80,
    ops_manager: 60,
    inventory_manager: 60,
    fulfillment_manager: 50,
    seo_manager: 50,
    content_editor: 40,
    support_agent: 30,
    store_viewer: 20,
    reviewer: 20,
});

const SUPER_ADMIN_RBAC_LEVEL = 400;
const COUNTRY_ADMIN_RBAC_LEVEL = 300;

const normCountry = (c) => (c ? String(c).toUpperCase() : c);

module.exports = {
    COMMERCE_STORE_ROLES,
    RBAC_ROLE_TO_CAPABILITY,
    STORE_ROLE_LEVEL,
    SUPER_ADMIN_RBAC_LEVEL,
    COUNTRY_ADMIN_RBAC_LEVEL,
    normCountry,
};
