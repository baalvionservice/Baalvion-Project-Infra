/**
 * @file server/http/security-log.ts
 * @description Structured, grep/alert-friendly security event log. This is a stdout-based
 * interim solution — every event is a single JSON line prefixed `[SECURITY]` so it can be
 * scraped by whatever log aggregator sits in front of the process (CloudWatch, Datadog, etc.)
 * in production. It intentionally never accepts secret material (HMAC secrets, raw signatures,
 * full envelope payloads) as a field value — callers pass only identifiers.
 *
 * TODO(infra): once a real audit/SIEM sink exists, swap the `console` calls here for it without
 * touching any call site — this is the single choke point for identity/authz security events.
 */

export type SecurityEventSeverity = 'info' | 'warn' | 'critical';

export interface SecurityEventDetails {
  actorId?: string;
  organizationId?: string;
  jti?: string;
  ip?: string | null;
  path?: string;
  method?: string;
  reason?: string;
  role?: string;
  [key: string]: unknown;
}

export function logSecurityEvent(
  event: string,
  details: SecurityEventDetails = {},
  severity: SecurityEventSeverity = 'info',
): void {
  const entry = {
    ts: new Date().toISOString(),
    event,
    severity,
    ...details,
  };
  const line = `[SECURITY] ${JSON.stringify(entry)}`;
  if (severity === 'critical') {
    console.error(line);
  } else {
    console.warn(line);
  }
}
