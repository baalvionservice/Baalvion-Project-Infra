/**
 * Events Contracts v1
 * System events, audit events, and alerts
 * 
 * STATE OWNERSHIP: UIState for subscriptions
 */

import { BaseEntity, UUID, Timestamp, TenantScoped, SeverityLevel, HealthStatus } from "./base";
import { Permission } from "./identity";
import { BillingState, PlanSlug } from "./billing";
import { ProxyType, ProxyStatus } from "./proxy";

// ============================================
// SYSTEM EVENT TYPES
// ============================================

export type SystemEventType =
  // Usage events
  | "usage.updated"
  | "usage.threshold.warning"
  | "usage.threshold.critical"
  | "usage.limit.exceeded"
  // Proxy events
  | "proxy.created"
  | "proxy.updated"
  | "proxy.deleted"
  | "proxy.rotated"
  | "proxy.health.changed"
  | "proxy.status.changed"
  // Provider events
  | "provider.health.changed"
  | "provider.incident.started"
  | "provider.incident.resolved"
  // Alert events
  | "alert.triggered"
  | "alert.acknowledged"
  | "alert.resolved"
  // Enforcement events
  | "enforcement.warning"
  | "enforcement.throttled"
  | "enforcement.blocked"
  // Plan events
  | "plan.trial.started"
  | "plan.trial.ending"
  | "plan.upgraded"
  | "plan.downgraded"
  | "plan.cancelled"
  | "plan.renewed"
  // User events
  | "user.invited"
  | "user.joined"
  | "user.removed"
  | "user.role.changed"
  // API Key events
  | "apikey.created"
  | "apikey.revoked"
  | "apikey.expired"
  // System events
  | "system.maintenance.scheduled"
  | "system.maintenance.started"
  | "system.maintenance.completed";

// ============================================
// SYSTEM EVENT
// ============================================

export interface SystemEvent<T = unknown> extends BaseEntity {
  type: SystemEventType;
  orgId?: UUID;
  userId?: UUID;
  resourceType?: string;
  resourceId?: UUID;
  payload: T;
  severity: SeverityLevel;
  acknowledged: boolean;
  acknowledgedAt?: Timestamp;
  acknowledgedBy?: UUID;
}

// ============================================
// EVENT PAYLOADS
// ============================================

export interface UsageUpdatedPayload {
  metricType: "bandwidth" | "requests";
  previousValue: number;
  currentValue: number;
  limit: number;
  percentage: number;
}

export interface ProxyHealthChangedPayload {
  proxyId: UUID;
  previousStatus: HealthStatus;
  currentStatus: HealthStatus;
  reason?: string;
}

export interface AlertTriggeredPayload {
  alertId: UUID;
  alertType: string;
  condition: string;
  value: number;
  threshold: number;
}

export interface EnforcementAppliedPayload {
  enforcementType: "warning" | "throttle" | "block";
  reason: string;
  duration?: number;
  affectedResources: UUID[];
}

export interface PlanChangedPayload {
  previousPlan: PlanSlug;
  newPlan: PlanSlug;
  previousBillingState: BillingState;
  newBillingState: BillingState;
  effectiveAt: Timestamp;
}

// ============================================
// AUDIT EVENT
// ============================================

export interface AuditEvent extends BaseEntity, TenantScoped {
  userId: UUID;
  userEmail: string;
  userName: string;
  
  // Action details
  action: AuditAction;
  category: AuditCategory;
  
  // Resource
  resourceType: string;
  resourceId?: UUID;
  resourceName?: string;
  
  // Details
  description: string;
  changes?: AuditChanges;
  
  // Context
  ipAddress: string;
  userAgent: string;
  sessionId: UUID;
  
  // Result
  success: boolean;
  errorMessage?: string;
}

export type AuditCategory = 
  | "authentication"
  | "authorization"
  | "proxy"
  | "billing"
  | "user"
  | "settings"
  | "api"
  | "export";

export type AuditAction =
  // Auth actions
  | "login"
  | "logout"
  | "mfa.enabled"
  | "mfa.disabled"
  | "password.changed"
  // Proxy actions
  | "proxy.created"
  | "proxy.updated"
  | "proxy.deleted"
  | "proxy.rotated"
  | "preset.created"
  | "preset.updated"
  | "preset.deleted"
  // User actions
  | "user.invited"
  | "user.removed"
  | "role.changed"
  // API actions
  | "apikey.created"
  | "apikey.revoked"
  // Billing actions
  | "plan.changed"
  | "payment.method.added"
  | "payment.method.removed"
  // Settings actions
  | "settings.updated"
  | "sso.configured"
  // Export actions
  | "data.exported"
  | "report.downloaded";

export interface AuditChanges {
  before: Record<string, unknown>;
  after: Record<string, unknown>;
}

// ============================================
// ALERT
// ============================================

export interface Alert extends BaseEntity, TenantScoped {
  type: AlertType;
  severity: SeverityLevel;
  status: AlertStatus;
  
  // Content
  title: string;
  message: string;
  
  // Source
  sourceType: string;
  sourceId?: UUID;
  sourceName?: string;
  
  // Timing
  triggeredAt: Timestamp;
  acknowledgedAt?: Timestamp;
  acknowledgedBy?: UUID;
  resolvedAt?: Timestamp;
  resolvedBy?: UUID;
  
  // Actions
  actions: AlertAction[];
  
  // Metadata
  metadata: Record<string, unknown>;
}

export type AlertType =
  | "usage_warning"
  | "usage_critical"
  | "usage_exceeded"
  | "proxy_health"
  | "provider_incident"
  | "billing_issue"
  | "security_warning"
  | "system_notification";

export type AlertStatus = "active" | "acknowledged" | "resolved" | "dismissed";

export interface AlertAction {
  id: string;
  label: string;
  type: "link" | "action";
  href?: string;
  actionType?: string;
}

// ============================================
// EVENT SUBSCRIPTION (for UI)
// ============================================

export interface EventSubscription {
  id: string;
  eventTypes: SystemEventType[];
  callback: (event: SystemEvent) => void;
}

// ============================================
// NOTIFICATION
// ============================================

export interface Notification extends BaseEntity {
  userId: UUID;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  readAt?: Timestamp;
  actionUrl?: string;
  metadata: Record<string, unknown>;
}

export type NotificationType =
  | "info"
  | "success"
  | "warning"
  | "error"
  | "alert";
