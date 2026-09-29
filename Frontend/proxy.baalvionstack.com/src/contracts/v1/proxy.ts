/**
 * Proxy Contracts v1
 * Proxy, IPPool, Provider, and Routing types
 * 
 * STATE OWNERSHIP: Shared, cached in UI
 */

import { BaseEntity, UUID, Timestamp, TenantScoped, AuditMeta, SeverityLevel, HealthStatus } from "./base";

// ============================================
// PROXY TYPE
// ============================================

export type ProxyType = "residential" | "mobile" | "datacenter";
export type ProxyProtocol = "http" | "https" | "socks5";
export type ProxyStatus = "active" | "maintenance" | "offline" | "limited" | "rotating";

// ============================================
// PROXY
// ============================================

export interface Proxy extends BaseEntity, TenantScoped, AuditMeta {
  type: ProxyType;
  protocol: ProxyProtocol;
  host: string;
  port: number;
  username: string;
  // password is never exposed to frontend
  
  // Location
  countryCode: string;
  country: string;
  region?: string;
  city?: string;
  
  // Status
  status: ProxyStatus;
  healthStatus: HealthStatus;
  lastHealthCheck: Timestamp;
  
  // Metrics
  bandwidthUsed: number;    // in MB
  bandwidthLimit: number;   // in MB
  requestCount: number;
  successRate: number;
  errorRate: number;
  avgLatency: number;       // in ms
  uptime: number;           // percentage
  
  // Configuration
  rotation: RotationConfig;
  poolId?: UUID;
  providerId?: UUID;
  
  // Tags and metadata
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface RotationConfig {
  mode: RotationMode;
  sessionDuration?: number; // in seconds
  rotateOnError: boolean;
}

export type RotationMode = "sticky" | "rotating" | "per_request";

// ============================================
// IP POOL
// ============================================

export interface IPPool extends BaseEntity {
  name: string;
  type: ProxyType;
  status: HealthStatus;
  
  // Pool metrics
  totalIPs: number;
  activeIPs: number;
  reservedIPs: number;
  
  // Performance
  avgLatency: number;
  successRate: number;
  errorRate: number;
  
  // Geography
  countries: string[];
  primaryCountry: string;
  
  // Provider association
  providerId: UUID;
  providerName: string;
}

// ============================================
// PROVIDER
// ============================================

export interface Provider extends BaseEntity {
  name: string;
  slug: string;
  status: HealthStatus;
  
  // Capabilities
  supportedTypes: ProxyType[];
  supportedProtocols: ProxyProtocol[];
  supportedCountries: string[];
  
  // Performance
  avgLatency: number;
  successRate: number;
  reliability: number; // percentage
  
  // Capacity
  totalCapacity: number;
  usedCapacity: number;
  
  // Monitoring
  lastHealthCheck: Timestamp;
  healthHistory: ProviderHealthPoint[];
  
  // Incidents
  activeIncidents: ProviderIncident[];
}

export interface ProviderHealthPoint {
  timestamp: Timestamp;
  latency: number;
  successRate: number;
  status: HealthStatus;
}

export interface ProviderIncident {
  id: UUID;
  type: IncidentType;
  severity: SeverityLevel;
  status: IncidentStatus;
  startTime: Timestamp;
  endTime?: Timestamp;
  description: string;
  affectedCountries: string[];
  affectedTypes: ProxyType[];
}

export type IncidentType = 
  | "latency_spike"
  | "error_rate_increase"
  | "partial_outage"
  | "full_outage"
  | "maintenance";

export type IncidentStatus = 
  | "investigating"
  | "identified"
  | "monitoring"
  | "resolved";

// ============================================
// ROUTING RULE
// ============================================

export interface RoutingRule extends BaseEntity, AuditMeta {
  name: string;
  description?: string;
  priority: number;
  enabled: boolean;
  
  // Conditions
  conditions: RoutingCondition[];
  
  // Actions
  action: RoutingAction;
  
  // Fallback
  fallbackProviderId?: UUID;
  fallbackEnabled: boolean;
}

export interface RoutingCondition {
  field: RoutingField;
  operator: RoutingOperator;
  value: string | string[] | number;
}

export type RoutingField = 
  | "country"
  | "proxy_type"
  | "domain"
  | "user_agent"
  | "time_of_day"
  | "user_tier";

export type RoutingOperator = 
  | "equals"
  | "not_equals"
  | "in"
  | "not_in"
  | "contains"
  | "starts_with"
  | "regex";

export interface RoutingAction {
  type: "use_provider" | "use_pool" | "load_balance" | "geo_match";
  providerId?: UUID;
  poolId?: UUID;
  weights?: Record<UUID, number>; // for load balancing
}

// ============================================
// PRESET
// ============================================

export interface Preset extends BaseEntity, TenantScoped, AuditMeta {
  name: string;
  description?: string;
  icon?: string;
  isSystem: boolean;
  
  // Configuration
  proxyType: ProxyType;
  protocol: ProxyProtocol;
  countries: string[];
  rotation: RotationConfig;
  
  // Filters
  minSuccessRate?: number;
  maxLatency?: number;
  
  // Tags
  tags: string[];
}

// ============================================
// PROXY LOG
// ============================================

export interface ProxyLog extends BaseEntity, TenantScoped {
  proxyId: UUID;
  requestId: UUID;
  
  // Request details
  url: string;
  method: string;
  statusCode: number;
  
  // Performance
  latency: number;
  bytesTransferred: number;
  
  // Result
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
  
  // Context
  userAgent?: string;
  referrer?: string;
}

// ============================================
// COUNTRY
// ============================================

export interface Country {
  code: string;      // ISO 3166-1 alpha-2
  name: string;
  flag: string;      // emoji
  region: string;
  subregion: string;
  
  // Availability
  residentialAvailable: boolean;
  mobileAvailable: boolean;
  datacenterAvailable: boolean;
  
  // Pool sizes
  residentialPoolSize: number;
  mobilePoolSize: number;
  datacenterPoolSize: number;
}
