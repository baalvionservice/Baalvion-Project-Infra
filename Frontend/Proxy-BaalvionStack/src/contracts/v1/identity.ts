/**
 * Identity Contracts v1
 * User, Organization, Role, and Permission types
 * 
 * STATE OWNERSHIP: SessionState, OrganizationState, UserState
 */

import { BaseEntity, UUID, Email, Timestamp, EntityStatus, TenantScoped, AuditMeta } from "./base";

// ============================================
// USER
// ============================================

export interface User extends BaseEntity, AuditMeta {
  email: Email;
  emailVerified: boolean;
  firstName: string;
  lastName: string;
  displayName: string;
  avatarUrl?: string;
  phoneNumber?: string;
  phoneVerified: boolean;
  status: UserStatus;
  lastLoginAt?: Timestamp;
  lastActiveAt?: Timestamp;
  mfaEnabled: boolean;
  preferences: UserPreferences;
  metadata: Record<string, unknown>;
}

export type UserStatus = "active" | "pending" | "suspended" | "deactivated";

export interface UserPreferences {
  theme: "light" | "dark" | "system";
  timezone: string;
  locale: string;
  notifications: NotificationPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  digest: "realtime" | "daily" | "weekly" | "none";
}

// ============================================
// ORGANIZATION (TENANT)
// ============================================

export interface Organization extends BaseEntity, AuditMeta {
  name: string;
  slug: string;
  domain?: string;
  logoUrl?: string;
  status: OrgStatus;
  settings: OrgSettings;
  billingEmail: Email;
  metadata: Record<string, unknown>;
}

export type OrgStatus = "active" | "trial" | "suspended" | "cancelled";

export interface OrgSettings {
  allowedAuthMethods: AuthMethod[];
  ssoEnabled: boolean;
  ssoProvider?: string;
  ipWhitelist: string[];
  enforceMfa: boolean;
  sessionTimeout: number; // minutes
  dataRetentionDays: number;
}

export type AuthMethod = "email" | "google" | "github" | "saml" | "oidc";

// ============================================
// WORKSPACE
// ============================================

export interface Workspace extends BaseEntity, TenantScoped, AuditMeta {
  name: string;
  slug: string;
  description?: string;
  status: EntityStatus;
  settings: WorkspaceSettings;
}

export interface WorkspaceSettings {
  defaultProxyType?: ProxyTypeRef;
  defaultCountries: string[];
  quotaOverride?: QuotaOverride;
}

export type ProxyTypeRef = "residential" | "mobile" | "datacenter";

export interface QuotaOverride {
  bandwidthLimit?: number;
  requestLimit?: number;
  proxyLimit?: number;
}

// ============================================
// ORGANIZATION MEMBERSHIP
// ============================================

export interface OrgMembership extends BaseEntity, TenantScoped {
  userId: UUID;
  roleId: UUID;
  status: MembershipStatus;
  invitedBy?: UUID;
  invitedAt?: Timestamp;
  joinedAt?: Timestamp;
}

export type MembershipStatus = "pending" | "active" | "suspended" | "removed";

// ============================================
// ROLE (PREDEFINED)
// ============================================

export interface Role extends BaseEntity {
  name: string;
  description: string;
  permissions: Permission[];
  isSystem: boolean;
  priority: number;
}

export type RoleType = "owner" | "admin" | "member" | "analyst" | "readonly" | "custom";

// ============================================
// PERMISSION (STRING-BASED)
// ============================================

export type Permission = 
  // Proxy permissions
  | "proxy:view"
  | "proxy:create"
  | "proxy:update"
  | "proxy:delete"
  | "proxy:rotate"
  | "proxy:export"
  // Usage permissions
  | "usage:view"
  | "usage:export"
  | "usage:manage"
  // Billing permissions
  | "billing:view"
  | "billing:manage"
  | "billing:export"
  // User/Team permissions
  | "user:view"
  | "user:invite"
  | "user:manage"
  | "user:remove"
  // API Key permissions
  | "apikey:view"
  | "apikey:create"
  | "apikey:revoke"
  // Admin permissions
  | "admin:view"
  | "admin:manage"
  | "admin:enforce"
  | "admin:audit"
  // Settings permissions
  | "settings:view"
  | "settings:manage"
  // Presets permissions
  | "preset:view"
  | "preset:create"
  | "preset:update"
  | "preset:delete";

// ============================================
// ROLE -> PERMISSION MAPPING
// ============================================

export const ROLE_PERMISSIONS: Record<RoleType, Permission[]> = {
  owner: [
    "proxy:view", "proxy:create", "proxy:update", "proxy:delete", "proxy:rotate", "proxy:export",
    "usage:view", "usage:export", "usage:manage",
    "billing:view", "billing:manage", "billing:export",
    "user:view", "user:invite", "user:manage", "user:remove",
    "apikey:view", "apikey:create", "apikey:revoke",
    "admin:view", "admin:manage", "admin:enforce", "admin:audit",
    "settings:view", "settings:manage",
    "preset:view", "preset:create", "preset:update", "preset:delete",
  ],
  admin: [
    "proxy:view", "proxy:create", "proxy:update", "proxy:delete", "proxy:rotate", "proxy:export",
    "usage:view", "usage:export", "usage:manage",
    "billing:view",
    "user:view", "user:invite", "user:manage",
    "apikey:view", "apikey:create", "apikey:revoke",
    "admin:view", "admin:manage",
    "settings:view", "settings:manage",
    "preset:view", "preset:create", "preset:update", "preset:delete",
  ],
  member: [
    "proxy:view", "proxy:create", "proxy:update", "proxy:rotate",
    "usage:view",
    "apikey:view", "apikey:create",
    "settings:view",
    "preset:view", "preset:create", "preset:update",
  ],
  analyst: [
    "proxy:view",
    "usage:view", "usage:export",
    "billing:view",
    "preset:view",
  ],
  readonly: [
    "proxy:view",
    "usage:view",
    "preset:view",
  ],
  custom: [],
};

// ============================================
// SESSION
// ============================================

export interface Session {
  id: UUID;
  userId: UUID;
  orgId: UUID;
  workspaceId?: UUID;
  roleType: RoleType;
  permissions: Permission[];
  createdAt: Timestamp;
  expiresAt: Timestamp;
  lastActivityAt: Timestamp;
  ipAddress: string;
  userAgent: string;
  mfaVerified: boolean;
}

// ============================================
// API KEY
// ============================================

export interface ApiKey extends BaseEntity, TenantScoped, AuditMeta {
  name: string;
  keyPrefix: string;
  hashedKey: string;
  permissions: Permission[];
  status: ApiKeyStatus;
  lastUsedAt?: Timestamp;
  expiresAt?: Timestamp;
  ipWhitelist: string[];
  rateLimit?: RateLimitConfig;
}

export type ApiKeyStatus = "active" | "revoked" | "expired";

export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  burstLimit: number;
}
