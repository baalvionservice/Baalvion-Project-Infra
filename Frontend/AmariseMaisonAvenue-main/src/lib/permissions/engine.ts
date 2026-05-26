/**
 * @fileOverview Granular Permission Definitions for the Maison Platform.
 * Restructured for Layered Tactical Nodes.
 */

export const PERMISSIONS = {
  // Layer 1 & 2: Global Master & Configuration
  VIEW_GLOBAL_HUD: "view_global_hud",
  OVERRIDE_SYSTEM: "override_system",
  MANAGE_HUBS: "manage_hubs",
  CONFIGURE_BRAND: "configure_brand",

  // Layer 3: Regional Hubs
  VIEW_COUNTRY_DASH: "view_country_dash",
  MANAGE_REGIONAL_OPS: "manage_regional_ops",

  // Layer 4: Functional Modules
  ACCESS_COMMERCE: "access_commerce",
  ACCESS_FINANCE: "access_finance",
  ACCESS_LOGISTICS: "access_logistics",
  ACCESS_AI: "access_ai",
  ACCESS_OBSERVABILITY: "access_observability",
  ACCESS_AUDIT: "access_audit",

  // Layer 5: Support & Partners
  ACCESS_CRM: "access_crm",
  ACCESS_VENDOR: "access_vendor",
  ACCESS_AUTOMATION: "access_automation",

  // Action Primitives
  READ: "read",
  CREATE: "create",
  EDIT: "edit",
  DELETE: "delete",
  PUBLISH: "publish",
  APPROVE: "approve",
  
  // Scoped Actions
  VIEW_OWN_ACTIVITY: "view_own_activity",
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS] | "*";
