import { v4 as uuidv4 } from 'uuid';
import type { EventType, PlatformEvent } from '@baalvion/types';

// ─── Typed event payload contracts ────────────────────────────────────────────

export interface LoginSuccessPayload {
  userId:    string;
  orgId:     string | null;
  email:     string;
  ipAddress: string;
  userAgent: string;
  mfaUsed:   boolean;
  sessionId: string;
}

export interface LoginFailedPayload {
  email:     string;
  ipAddress: string;
  reason:    'invalid_credentials' | 'account_disabled' | 'rate_limited' | 'mfa_failed';
  attemptNo: number;
}

export interface SessionRevokedPayload {
  sessionId: string;
  userId:    string;
  orgId:     string | null;
  reason:    'logout' | 'admin_revoke' | 'security' | 'expired';
}

export interface TokenReusePayload {
  userId:    string;
  orgId:     string | null;
  familyId:  string;
  ipAddress: string;
}

export interface SecurityIncidentPayload {
  type:      'token_reuse' | 'geo_anomaly' | 'brute_force' | 'impossible_travel' | 'tor_exit_node';
  userId:    string;
  orgId:     string | null;
  severity:  'low' | 'medium' | 'high' | 'critical';
  details:   Record<string, unknown>;
}

export interface OrgMemberInvitedPayload {
  orgId:     string;
  orgName:   string;
  inviteeEmail: string;
  invitedBy: string;
  role:      string;
}

export interface ApiKeyCreatedPayload {
  keyId:   string;
  orgId:   string;
  userId:  string;
  name:    string;
  scopes:  string[];
}

export interface FeatureFlagUpdatedPayload {
  flagId:    string;
  key:       string;
  enabled:   boolean;
  rollout:   number;
  updatedBy: string;
}

// ─── Typed event builders ─────────────────────────────────────────────────────

type TypedEvent<K extends EventType, P> = PlatformEvent<P> & { type: K };

function buildEvent<K extends EventType, P>(
  type:    K,
  payload: P,
  meta:    { orgId?: string | null; userId?: string | null; traceId?: string } = {},
): TypedEvent<K, P> {
  return {
    id:        uuidv4(),
    type,
    payload,
    orgId:     meta.orgId  ?? null,
    userId:    meta.userId ?? null,
    timestamp: new Date().toISOString(),
    traceId:   meta.traceId ?? uuidv4(),
  };
}

export const Events = {
  loginSuccess:      (p: LoginSuccessPayload,      m?: object) => buildEvent('auth.login.success',         p, m as any),
  loginFailed:       (p: LoginFailedPayload,       m?: object) => buildEvent('auth.login.failed',          p, m as any),
  sessionRevoked:    (p: SessionRevokedPayload,    m?: object) => buildEvent('auth.session.revoked',       p, m as any),
  tokenReuse:        (p: TokenReusePayload,        m?: object) => buildEvent('auth.token.reuse_detected',  p, m as any),
  securityIncident:  (p: SecurityIncidentPayload,  m?: object) => buildEvent('security.incident',          p, m as any),
  memberInvited:     (p: OrgMemberInvitedPayload,  m?: object) => buildEvent('org.member.invited',         p, m as any),
  apiKeyCreated:     (p: ApiKeyCreatedPayload,     m?: object) => buildEvent('api_key.created',             p, m as any),
  flagUpdated:       (p: FeatureFlagUpdatedPayload,m?: object) => buildEvent('feature_flag.updated',        p, m as any),
};

// ─── Publisher interface ──────────────────────────────────────────────────────

export interface EventPublisher {
  publish<T>(event: PlatformEvent<T>): Promise<void>;
  publishMany<T>(events: PlatformEvent<T>[]): Promise<void>;
}

// ─── Redis publisher factory ──────────────────────────────────────────────────

export interface RedisClient {
  publish(channel: string, message: string): Promise<number>;
  xadd(key: string, id: string, ...args: string[]): Promise<string | null>;
}

export interface PublisherLogger {
  error(obj: object, msg: string): void;
  debug(obj: object, msg: string): void;
}

export function createRedisPublisher(
  client: RedisClient | null,
  logger: PublisherLogger,
): EventPublisher {
  const STREAM_KEY = 'baalvion:event_stream';

  async function publishOne<T>(event: PlatformEvent<T>): Promise<void> {
    if (!client) return;

    const serialized = JSON.stringify(event);
    try {
      await Promise.all([
        client.publish(`baalvion:events:${event.type}`, serialized),
        client.xadd(STREAM_KEY, '*', 'type', event.type, 'payload', serialized),
      ]);
      logger.debug({ eventId: event.id, type: event.type }, 'Event published');
    } catch (err) {
      logger.error({ err, eventId: event.id, type: event.type }, 'Failed to publish event');
    }
  }

  return {
    publish:    publishOne,
    publishMany: (events) => Promise.all(events.map(publishOne)).then(() => void 0),
  };
}

// ─── No-op publisher (for testing / services without Redis) ──────────────────

export function createNoopPublisher(): EventPublisher {
  return {
    publish:    async () => { /* no-op */ },
    publishMany: async () => { /* no-op */ },
  };
}

// ─── Cross-division domain events + durable broker + outbox (Prompt 11) ──────────
export * from './domain';
export * from './broker';
export * from './outbox';

// Re-export core types
export type { PlatformEvent, EventType };
