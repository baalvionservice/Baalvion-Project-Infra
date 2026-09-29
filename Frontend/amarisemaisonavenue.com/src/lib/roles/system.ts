/**
 * @fileOverview Centralized Role Definitions for the Maison Platform.
 * Restructured for Layered Enterprise Architecture.
 */

export const ROLES = {
  SUPER_ADMIN: "super_admin",       // Layer 1 & 2: Global Oversight
  GLOBAL_ADMIN: "global_admin",     // Layer 2: Global Configuration
  COUNTRY_ADMIN: "country_admin",   // Layer 3: Regional Hub Lead
  OPERATIONS_ADMIN: "ops_admin",    // Layer 4: Commerce & Logistics
  FINANCE_ADMIN: "finance_admin",   // Layer 4: Treasury & Settlement
  CONTENT_ADMIN: "content_admin",   // Layer 4: CMS & SEO
  AI_ADMIN: "ai_admin",             // Layer 4: Neural Control
  SUPPORT_ADMIN: "support_admin",   // Layer 5: CRM & Care
  VENDOR: "vendor",                 // Layer 5: Partner Atelier
  CLIENT: "client"                  // Public Persona
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];
