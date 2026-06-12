/**
 * @fileOverview Unified Backend Contracts & Type Definitions
 * Single source of truth for shared backend types (User, Auth, RBAC, CMS, Commerce, etc.).
 * All services and SDKs should import from this package to avoid duplication and casing drift.
 */

// ─── User & Identity ──────────────────────────────────────────────────────────

export type UserStatus = 'active' | 'suspended' | 'pending';
// Per-organization (tenant-scoped) roles. NEVER grant tenant-RLS bypass (C4).
export type UserRole   = 'super_admin' | 'owner' | 'admin' | 'manager' | 'editor' | 'member' | 'viewer';
// Global platform-operator roles — a separate dimension from UserRole, never an org membership.
// Only platform_admin / platform_security_admin may bypass tenant isolation.
export type PlatformRole = 'platform_admin' | 'platform_security_admin' | 'platform_support_admin';
export type OrgPlan    = 'free' | 'starter' | 'pro' | 'enterprise';

export interface User {
  id:            string;
  email:         string;
  fullName:      string | null;
  avatarUrl:     string | null;
  status:        UserStatus;
  emailVerified: boolean;
  mfaEnabled:    boolean;
  createdAt:     string;
  updatedAt:     string;
}

export interface Organization {
  id:        string;
  name:      string;
  slug:      string;
  plan:      OrgPlan;
  ownerId:   string;
  logoUrl:   string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  userId:       string;
  orgId:        string;
  role:         UserRole;
  serviceRoles: Record<string, string[]>;
  joinedAt:     string;
  status:       'active' | 'invited' | 'removed';
  user?:        Pick<User, 'id' | 'email' | 'fullName' | 'avatarUrl'>;
}

// ─── JWT Token Payloads ───────────────────────────────────────────────────────

export interface AccessTokenPayload {
  sub:             string;
  email:           string;
  org_id:          string | null;
  role:            UserRole;
  permissions:     string[];
  sid:             string;
  jti:             string;
  iss:             string;
  aud:             string | string[];
  iat:             number;
  exp:             number;
  impersonated_by?: string;
}

export interface RefreshTokenPayload {
  sub:       string;
  sid:       string;
  family_id: string;
  jti:       string;
  iss:       string;
  iat:       number;
  exp:       number;
}

export interface TokenPair {
  accessToken:  string;
  refreshToken: string;
  expiresAt:    string;
  role?:        UserRole;
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export type DeviceType = 'desktop' | 'mobile' | 'tablet' | 'unknown';

export interface Session {
  id:          string;
  userId:      string;
  orgId:       string | null;
  ipAddress:   string;
  userAgent:   string;
  country:     string | null;
  city:        string | null;
  deviceType:  DeviceType;
  riskScore:   number;
  riskSignals: RiskSignal[];
  createdAt:   string;
  lastSeenAt:  string;
  expiresAt:   string;
}

export interface RiskSignal {
  type:    string;
  details: Record<string, unknown>;
}

// ─── OAuth ────────────────────────────────────────────────────────────────────

export type GrantType    = 'authorization_code' | 'client_credentials' | 'refresh_token' | 'device_code';
export type ResponseType = 'code' | 'token' | 'id_token';

export interface OAuthClient {
  id:             string;
  name:           string;
  orgId:          string;
  clientId:       string;
  redirectUris:   string[];
  scopes:         string[];
  grantTypes:     GrantType[];
  isConfidential: boolean;
  logoUrl:        string | null;
  createdAt:      string;
}

export interface OAuthToken {
  access_token:  string;
  token_type:    'Bearer';
  expires_in:    number;
  scope:         string;
  id_token?:     string;
  refresh_token?: string;
}

// ─── API Keys ─────────────────────────────────────────────────────────────────

export type ApiKeyEnvironment = 'live' | 'test';

export interface ApiKey {
  id:          string;
  name:        string;
  prefix:      string;
  orgId:       string;
  createdBy:   string;
  scopes:      string[];
  environment: ApiKeyEnvironment;
  expiresAt:   string | null;
  lastUsedAt:  string | null;
  revokedAt:   string | null;
  createdAt:   string;
}

// ─── Audit ────────────────────────────────────────────────────────────────────

export type AuditSeverity = 'low' | 'medium' | 'high' | 'critical';

export type AuditAction =
  | 'user.register'
  | 'user.login'
  | 'user.login_failed'
  | 'user.logout'
  | 'user.password_reset'
  | 'user.password_changed'
  | 'user.email_verified'
  | 'user.suspended'
  | 'user.unsuspended'
  | 'mfa.enabled'
  | 'mfa.disabled'
  | 'mfa.verified'
  | 'session.revoked'
  | 'session.all_revoked'
  | 'token.reuse_detected'
  | 'token.refresh'
  | 'org.created'
  | 'org.updated'
  | 'org.member_invited'
  | 'org.member_joined'
  | 'org.member_removed'
  | 'org.member_role_changed'
  | 'api_key.created'
  | 'api_key.revoked'
  | 'api_key.used'
  | 'oauth.client_created'
  | 'oauth.client_deleted'
  | 'oauth.token_issued'
  | 'oauth.token_revoked'
  | 'security.incident'
  | 'security.geo_anomaly'
  | 'admin.impersonation_started'
  | 'admin.impersonation_ended'
  | 'flag.created'
  | 'flag.updated'
  | 'flag.deleted'
  // ── CMS / Knowledge ──
  | 'cms.content.published'
  | 'cms.content.unpublished'
  | 'cms.integration.updated'
  | 'cms.integration.removed'
  | 'cms.member.invited'
  // ── Payments / Commerce ──
  | 'payment.intent.created'
  | 'payment.captured'
  | 'payment.failed'
  | 'payment.refunded'
  | 'commerce.store.role_assigned'
  // ── Notifications ──
  | 'notification.dispatched';

export interface AuditEntry {
  id:           string;
  userId:       string | null;
  orgId:        string | null;
  action:       AuditAction;
  resourceType: string | null;
  resourceId:   string | null;
  metadata:     Record<string, unknown>;
  ipAddress:    string;
  userAgent:    string | null;
  severity:     AuditSeverity;
  createdAt:    string;
}

// ─── Feature Flags ────────────────────────────────────────────────────────────

export interface FeatureFlag {
  id:        string;
  key:       string;
  name:      string;
  enabled:   boolean;
  rollout:   number;
  targeting: FlagTargeting;
  orgId:     string | null;
  updatedAt: string;
}

export interface FlagTargeting {
  userIds?:    string[];
  orgIds?:     string[];
  attributes?: Record<string, string | string[]>;
}

// ─── Integrations & Keys (CMS vault contracts) ────────────────────────────────
// The CMS is the platform's SOLE secret vault. These contracts describe a tenant's
// external-provider integrations. The console/management shape exposes masked
// hints only; the *resolved* shape (internal resolver / sdk.config) adds decrypted
// secrets and is NEVER returned to a browser. AES encryption lives only in the CMS.

export type IntegrationCategory = 'api' | 'payment' | 'sms' | 'ai' | 'webhook' | 'other';
export type IntegrationStatus   = 'configured' | 'unconfigured' | 'error';

/** Management/console view of an integration — masked, no plaintext secrets. */
export interface IntegrationDefinition {
  provider:    string;                          // 'razorpay' | 'stripe' | 'twilio' | 'gemini' | …
  category:    IntegrationCategory;
  label:       string;
  enabled:     boolean;
  status:      IntegrationStatus;
  config:      Record<string, string>;          // non-secret config (baseUrl, mode, publishableKey…)
  secretHints: Record<string, string | null>;   // masked (••••1234)
  updatedAt?:  string;
}

/** Internal-resolver view (sdk.config) — includes DECRYPTED secret values. */
export interface ResolvedIntegration {
  provider: string;
  category: IntegrationCategory;
  enabled:  boolean;
  status:   IntegrationStatus;
  config:   Record<string, string>;
  secrets:  Record<string, string>;             // plaintext — service-to-service only
}

// ─── Tenancy ──────────────────────────────────────────────────────────────────
// Platform invariant: a tenant == an organisation == a CMS website. The canonical
// tenant key across config, events, and audit is the website **slug**.

export interface TenantRef {
  /** Canonical tenant key — the CMS website slug (e.g. "baalvion-mining"). */
  tenantSlug: string;
  /** The owning organisation id (UUID), when known. */
  orgId?:     string | null;
}

// ─── Platform Events ──────────────────────────────────────────────────────────

export interface PlatformEvent<T = unknown> {
  id:        string;
  type:      EventType;
  payload:   T;
  orgId:     string | null;
  userId:    string | null;
  timestamp: string;
  traceId:   string;
}

export type EventType =
  | 'auth.login.success'
  | 'auth.login.failed'
  | 'auth.session.revoked'
  | 'auth.token.reuse_detected'
  | 'auth.mfa.enabled'
  | 'auth.mfa.disabled'
  | 'security.incident'
  | 'security.geo_anomaly'
  | 'org.member.invited'
  | 'org.member.joined'
  | 'org.member.removed'
  | 'api_key.created'
  | 'api_key.revoked'
  | 'feature_flag.updated'
  | 'metrics.threshold'
  | 'notification.sent'
  | 'admin.impersonation'
  // ── Cross-division platform domain events (Prompt 11 / bounded-context contracts) ──
  | 'org.created'
  | 'proxy.session.started'
  | 'proxy.session.ended'
  | 'billing.invoice.generated'
  | 'billing.payment.succeeded'
  | 'billing.payment.failed'
  | 'provider.health.changed'
  | 'abuse.action.triggered'
  // ── Knowledge / CMS domain (SDK adoption — Phase 2) ──
  | 'cms.content.published'
  | 'cms.content.unpublished'
  | 'cms.integration.updated'
  | 'cms.integration.removed'
  | 'cms.member.invited'
  // ── Commerce / Payments domain (gateway checkout — Phase 3) ──
  | 'payment.created'
  | 'payment.authorized'
  | 'payment.captured'
  | 'payment.failed'
  | 'payment.refunded'
  | 'payment.ledger.recorded'
  // ── Notifications ──
  | 'notification.dispatched';

// ─── Pagination & Responses ───────────────────────────────────────────────────

export interface Paginated<T> {
  items:   T[];
  total:   number;
  page:    number;
  limit:   number;
  hasMore: boolean;
}

export interface ApiSuccess<T> {
  success:   true;
  data:      T;
  requestId: string;
}

export interface ApiError {
  success: false;
  error: {
    code:      string;
    message:   string;
    details?:  unknown;
    requestId: string;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── RBAC ─────────────────────────────────────────────────────────────────────

export interface Permission {
  action:   string;
  resource: string;
  scope?:   'own' | 'org' | 'global';
}

export interface RoleDefinition {
  name:        UserRole;
  permissions: Permission[];
  inherits?:   UserRole[];
}

// ─── Request Context (attached by authMiddleware) ─────────────────────────────

export interface AuthContext {
  userId:    string;
  email:     string;
  orgId:     string | null;
  role:      UserRole;
  permissions: string[];
  sessionId: string;
  jti:       string;
  isImpersonation: boolean;
  impersonatedBy?: string;
}

declare global {
  namespace Express {
    interface Request {
      auth?:      AuthContext;
      requestId?: string;
      startTime?: number;
    }
  }
}
