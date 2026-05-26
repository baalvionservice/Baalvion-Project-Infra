export type RbacPermission =
  | 'users:read' | 'users:write' | 'users:delete' | 'users:impersonate'
  | 'orgs:read' | 'orgs:write' | 'orgs:delete'
  | 'sessions:read' | 'sessions:kill'
  | 'oauth:read' | 'oauth:write' | 'oauth:delete'
  | 'audit:read'
  | 'security:read' | 'security:write'
  | 'mfa:manage'
  | 'tokens:revoke'
  | 'keys:rotate'
  | 'sso:configure'
  | '*';

export interface RbacRole {
  id:           string;
  name:         string;
  displayName:  string;
  description:  string;
  isSystem:     boolean;
  permissions:  RbacPermission[];
  memberCount:  number;
  createdAt:    string;
  updatedAt:    string;
}

export interface ApiKey {
  id:           string;
  name:         string;
  keyPrefix:    string;
  scopes:       string[];
  orgId:        string | null;
  userId:       string;
  lastUsedAt:   string | null;
  expiresAt:    string | null;
  createdAt:    string;
  status:       'active' | 'revoked' | 'expired';
}

export interface JwksKey {
  kid:     string;
  kty:     string;
  use:     string;
  alg:     string;
  n?:      string;
  e?:      string;
  crv?:    string;
  x?:      string;
  y?:      string;
  status:  'active' | 'retiring' | 'retired';
  createdAt: string;
}

export interface SsoConfig {
  id:         string;
  orgId:      string;
  provider:   'saml' | 'oidc';
  domain:     string;
  enabled:    boolean;
  metadata:   Record<string, unknown>;
  createdAt:  string;
  updatedAt:  string;
}

export interface MfaPolicy {
  orgId:          string;
  required:       boolean;
  methods:        ('totp' | 'sms' | 'passkey')[];
  graceperiodDays: number;
  updatedAt:      string;
}

export interface RiskEvent {
  id:         string;
  userId:     string;
  userEmail:  string;
  type:       'impossible_travel' | 'brute_force' | 'credential_stuffing' | 'token_reuse' | 'geo_anomaly' | 'device_new';
  severity:   'low' | 'medium' | 'high' | 'critical';
  ip:         string;
  country:    string;
  city:       string;
  details:    Record<string, unknown>;
  resolvedAt: string | null;
  createdAt:  string;
}

export interface LoginHeatmapEntry {
  hour:    number;
  day:     number;
  count:   number;
  failed:  number;
}

export interface DeviceInfo {
  id:           string;
  userId:       string;
  fingerprint:  string;
  userAgent:    string;
  os:           string;
  browser:      string;
  lastSeenAt:   string;
  trusted:      boolean;
  createdAt:    string;
}
