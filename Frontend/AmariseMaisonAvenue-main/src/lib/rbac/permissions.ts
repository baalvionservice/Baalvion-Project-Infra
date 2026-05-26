/**
 * @fileOverview Granular permission definitions for the Maison platform.
 */

export const PERMISSIONS = {
  // Global & Analytics
  VIEW_DASHBOARD: "view_dashboard",
  VIEW_AUDIT_LOGS: "view_audit_logs",

  // AI Autopilot
  ACCESS_AI: "access_ai",
  CONTROL_AI: "control_ai",

  // Sales & CRM
  VIEW_LEADS: "view_leads",
  MANAGE_LEADS: "manage_leads",
  DISPATCH_WHATSAPP: "dispatch_whatsapp",

  // Content & CMS
  CREATE_CONTENT: "create_content",
  EDIT_CONTENT: "edit_content",
  PUBLISH_CONTENT: "publish_content",
  DELETE_CONTENT: "delete_content",

  // SEO Authority
  ACCESS_SEO: "access_seo",
  MANAGE_METADATA: "manage_metadata",

  // Monetization & Finance
  VIEW_REVENUE: "view_revenue",
  CONTROL_PRICING: "control_pricing",
  MANAGE_INVOICES: "manage_invoices",

  // Inventory & Listings
  CREATE_LISTING: "create_listing",
  EDIT_LISTING: "edit_listing",
  DELETE_LISTING: "delete_listing",

  // Vendor Specific
  MANAGE_OWN_LISTINGS: "manage_own_listings",

  // Client Specific
  VIEW_OWN_ACTIVITY: "view_own_activity",
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS] | "*";
