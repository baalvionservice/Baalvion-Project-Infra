/**
 * Cross-division platform domain events (bounded-context integration contracts).
 *
 * These are the events that flow BETWEEN bounded contexts on the enterprise event
 * bus — distinct from the auth-domain events in index.ts. They are the public,
 * versioned integration surface of each context: a consuming service depends ONLY
 * on these contracts, never on the producing service's internals.
 *
 * Subject convention (NATS) / topic convention (Kafka): `<context>.<aggregate>.<event>`
 * e.g. `proxy.session.started`, `billing.invoice.generated`.
 */
import { v4 as uuidv4 } from 'uuid';
import type { EventType, PlatformEvent } from '@baalvion/types';

// ─── Payload contracts (v1) ────────────────────────────────────────────────────

export interface OrganizationCreatedPayload {
  orgId: string;
  name: string;
  slug: string;
  plan: string;
  ownerUserId: string;
  createdAt: string;
}

export interface ProxySessionStartedPayload {
  sessionId: string;
  orgId: string;
  apiKeyId: string | null;
  provider: string;
  country: string | null;
  rotation: 'sticky' | 'rotating';
  kind: 'residential' | 'mobile' | 'datacenter' | 'isp' | 'dedicated' | string;
  startedAt: string;
}

export interface ProxySessionEndedPayload {
  sessionId: string;
  orgId: string;
  bytesIn: number;
  bytesOut: number;
  requests: number;
  durationMs: number;
  endedAt: string;
}

export interface BillingInvoiceGeneratedPayload {
  invoiceId: string;
  orgId: string;
  periodStart: string;
  periodEnd: string;
  totalGb: number;
  amount: number;
  currency: string;
  signature: string; // HMAC integrity signature from the billing engine
}

export interface PaymentResultPayload {
  invoiceId: string;
  orgId: string;
  amount: number;
  currency: string;
  provider: 'razorpay' | string;
  reference?: string;
  reason?: string;
}

export interface ProviderHealthChangedPayload {
  provider: string;
  previousState: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'OFFLINE' | string;
  newState: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'OFFLINE' | string;
  successRate: number;
  banRate: number;
  latencyMs: number;
  region?: string;
}

export interface AbuseActionTriggeredPayload {
  orgId: string;
  action: 'warn' | 'throttle' | 'suspend' | 'block_destination' | 'quarantine_ip' | string;
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  caseId?: string;
  actorId?: string | null;
}

// ─── Builder ────────────────────────────────────────────────────────────────────

type TypedEvent<K extends EventType, P> = PlatformEvent<P> & { type: K };

function build<K extends EventType, P>(
  type: K,
  payload: P,
  meta: { orgId?: string | null; userId?: string | null; traceId?: string } = {},
): TypedEvent<K, P> {
  return {
    id: uuidv4(),
    type,
    payload,
    orgId: meta.orgId ?? null,
    userId: meta.userId ?? null,
    timestamp: new Date().toISOString(),
    traceId: meta.traceId ?? uuidv4(),
  };
}

/** Versioned builders for the cross-division domain events. */
export const DomainEvents = {
  organizationCreated: (p: OrganizationCreatedPayload, m?: object) =>
    build('org.created', p, { orgId: p.orgId, ...(m as object) }),
  proxySessionStarted: (p: ProxySessionStartedPayload, m?: object) =>
    build('proxy.session.started', p, { orgId: p.orgId, ...(m as object) }),
  proxySessionEnded: (p: ProxySessionEndedPayload, m?: object) =>
    build('proxy.session.ended', p, { orgId: p.orgId, ...(m as object) }),
  billingInvoiceGenerated: (p: BillingInvoiceGeneratedPayload, m?: object) =>
    build('billing.invoice.generated', p, { orgId: p.orgId, ...(m as object) }),
  paymentSucceeded: (p: PaymentResultPayload, m?: object) =>
    build('billing.payment.succeeded', p, { orgId: p.orgId, ...(m as object) }),
  paymentFailed: (p: PaymentResultPayload, m?: object) =>
    build('billing.payment.failed', p, { orgId: p.orgId, ...(m as object) }),
  providerHealthChanged: (p: ProviderHealthChangedPayload, m?: object) =>
    build('provider.health.changed', p, m as object),
  abuseActionTriggered: (p: AbuseActionTriggeredPayload, m?: object) =>
    build('abuse.action.triggered', p, { orgId: p.orgId, ...(m as object) }),
};

/** The NATS subject / Kafka topic for an event type (stable, replay-friendly). */
export function subjectFor(type: EventType): string {
  return type; // dotted type IS the subject; NATS wildcards (`proxy.>`) work directly.
}
