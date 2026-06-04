/**
 * @baelbvion/sdk — public type surface (the contract every service codes against).
 *
 * The SDK is a COMPOSITION layer. It standardizes six concerns behind one set of
 * interfaces and one factory (`createSdk`). Implementations either wrap an
 * existing platform package (events, logger, telemetry) or fill a real gap
 * (config-resolver → CMS hub, internal-auth, http-client, trace-context).
 *
 * Tenancy note: in this platform a tenant == an organisation == a CMS "website".
 * Everything is keyed by a `tenantSlug` (the CMS website slug, e.g. "baelbvion-mining").
 */

// Unified contract from @baelbvion/types to prevent duplication & casing drift
import type { IntegrationCategory } from '@baelbvion/types';
export type { IntegrationCategory };

// ─────────────────────────────────────────────────────────────────────────────
// 1. TRACE CONTEXT — end-to-end request tracking
// ─────────────────────────────────────────────────────────────────────────────

export interface TraceContext {
  /** Correlation id propagated across every service hop for one logical request. */
  traceId: string;
  /** Current span within the trace (optional; set by telemetry/middleware). */
  spanId?: string;
  /** Tenant (== orgId == website slug) the request is acting for, if known. */
  tenantId: string | null;
  /** Acting user, if the request originated from an authenticated principal. */
  userId?: string | null;
  /** The service that owns the currently-executing code. */
  service: string;
}

export interface TraceProvider {
  /** The trace context bound to the currently-executing async chain, if any. */
  current(): TraceContext | undefined;
  /** Run `fn` with a (partial) trace context bound for its entire async subtree. */
  runWith<T>(ctx: Partial<TraceContext>, fn: () => T): T;
  /** Express middleware: derive/propagate traceId + tenantId from inbound headers. */
  middleware(): SdkMiddleware;
  /** Outbound propagation headers (traceparent-style + x-tenant-id) for HTTP/events. */
  outboundHeaders(): Record<string, string>;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. LOGGER — structured logging with automatic trace binding
// ─────────────────────────────────────────────────────────────────────────────

export interface SdkLogger {
  trace(obj: object | string, msg?: string): void;
  debug(obj: object | string, msg?: string): void;
  info(obj: object | string, msg?: string): void;
  warn(obj: object | string, msg?: string): void;
  error(obj: object | string, msg?: string): void;
  /** Child logger with permanent extra bindings (e.g. { module: 'payments' }). */
  child(bindings: Record<string, unknown>): SdkLogger;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. CONFIG RESOLVER — secrets/keys from the CMS Integrations & Keys hub
// ─────────────────────────────────────────────────────────────────────────────

/** One resolved integration for a tenant (mirrors cms-service's internal resolver). */
export interface IntegrationConfig {
  provider: string;                    // 'razorpay' | 'stripe' | 'backend_api' | 'twilio' | 'gemini' | …
  category: IntegrationCategory;
  enabled: boolean;
  status: string;                      // 'configured' | 'unconfigured' | 'error'
  config: Record<string, string>;      // non-secret config (baseUrl, mode, publishableKey…)
  secrets: Record<string, string>;     // DECRYPTED secret values (internal resolver only)
}

export interface ConfigResolver {
  /** All integrations configured for a tenant. */
  getIntegrations(tenantSlug: string): Promise<IntegrationConfig[]>;
  /** A single provider's integration, or null if not configured. */
  getIntegration(tenantSlug: string, provider: string): Promise<IntegrationConfig | null>;
  /** Convenience: one secret value (e.g. razorpay keySecret). undefined if absent. */
  getSecret(tenantSlug: string, provider: string, key: string): Promise<string | undefined>;
  /** The single enabled payment provider for a tenant, if any. */
  getPaymentProvider(tenantSlug: string): Promise<IntegrationConfig | null>;
  /** Drop cached config for a tenant (call when keys change in the console). */
  invalidate(tenantSlug: string, provider?: string): Promise<void>;
}

export interface ConfigResolverOptions {
  /** cms-service API base, e.g. http://localhost:3018/api/v1 */
  cmsBaseUrl: string;
  /** Shared secret sent as x-internal-secret to the resolver. */
  internalSecret: string;
  /** Cache TTL for resolved config (default 60s). Keys change rarely; events bust it. */
  cacheTtlSeconds?: number;
  /** Pluggable cache (Redis via @baelbvion/cache, or the built-in in-memory cache). */
  cache?: SdkCache;
  logger?: SdkLogger;
  fetchImpl?: FetchLike;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. INTERNAL AUTH — service-to-service authentication + request signing
// ─────────────────────────────────────────────────────────────────────────────

export type InternalAuthScheme = 'shared-secret' | 'hmac';

export interface InternalAuth {
  /** Headers to attach to an outbound internal request (x-internal-secret / HMAC). */
  signHeaders(req?: SignableRequest): Record<string, string>;
  /** Express middleware that rejects unsigned/invalid internal requests (401). */
  verifyMiddleware(): SdkMiddleware;
  /** Transport-agnostic verification of raw header values. */
  verify(headers: Record<string, string | undefined>, req?: SignableRequest): boolean;
  /** Role gate for verified principals (delegates to @baelbvion/rbac semantics). */
  requireRole(...roles: string[]): SdkMiddleware;
}

export interface SignableRequest {
  method?: string;
  path?: string;
  body?: string;
}

export interface InternalAuthOptions {
  /** Caller identity stamped onto signed requests (x-internal-service). */
  serviceName: string;
  /** Shared INTERNAL_SERVICE_SECRET. */
  secret: string;
  /** 'shared-secret' (header equality) or 'hmac' (timestamped signature). Default shared-secret. */
  scheme?: InternalAuthScheme;
  /** Max age of an HMAC-signed request, seconds (default 300). */
  clockSkewSeconds?: number;
  logger?: SdkLogger;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. HTTP CLIENT — resilient inter-service calls (retry / timeout / breaker)
// ─────────────────────────────────────────────────────────────────────────────

export interface HttpRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  timeoutMs?: number;
  /** Retry attempts on network error / 5xx / 429 (default from client options). */
  retries?: number;
  retryBackoffMs?: number;
  /** Attach internal-auth signature headers (service-to-service). */
  internal?: boolean;
  /** Propagate the current trace context headers (default true). */
  trace?: boolean;
  signal?: AbortSignal;
}

export interface HttpResponse<T = unknown> {
  status: number;
  ok: boolean;
  data: T;
  headers: Record<string, string>;
}

export interface HttpClient {
  request<T = unknown>(url: string, opts?: HttpRequestOptions): Promise<HttpResponse<T>>;
  get<T = unknown>(url: string, opts?: HttpRequestOptions): Promise<HttpResponse<T>>;
  post<T = unknown>(url: string, body?: unknown, opts?: HttpRequestOptions): Promise<HttpResponse<T>>;
  put<T = unknown>(url: string, body?: unknown, opts?: HttpRequestOptions): Promise<HttpResponse<T>>;
  patch<T = unknown>(url: string, body?: unknown, opts?: HttpRequestOptions): Promise<HttpResponse<T>>;
  delete<T = unknown>(url: string, opts?: HttpRequestOptions): Promise<HttpResponse<T>>;
}

export interface CircuitBreakerOptions {
  /** Open the circuit after N consecutive failures (default 5). */
  failureThreshold?: number;
  /** Stay open this long before a half-open probe (default 15000ms). */
  resetTimeoutMs?: number;
  /** Concurrent probes allowed while half-open (default 1). */
  halfOpenMax?: number;
}

export interface HttpClientOptions {
  baseUrl?: string;
  defaultTimeoutMs?: number;          // default 8000
  defaultRetries?: number;            // default 2 (idempotent methods only)
  defaultRetryBackoffMs?: number;     // default 200 (exponential)
  circuitBreaker?: CircuitBreakerOptions | false;
  internalAuth?: InternalAuth;
  trace?: TraceProvider;
  logger?: SdkLogger;
  fetchImpl?: FetchLike;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. EVENT BUS — one canonical event schema over @baelbvion/events
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The canonical platform event envelope. Maps onto @baelbvion/types `PlatformEvent`
 * ( eventType→type, tenantId→orgId ) so the SDK and the existing bus interoperate.
 */
export interface SdkEvent<T = unknown> {
  eventType: string;
  tenantId: string | null;
  timestamp: string;
  traceId: string;
  payload: T;
  id?: string;
  userId?: string | null;
}

export interface EventSubscription {
  unsubscribe(): Promise<void>;
}

export interface SdkEventBus {
  /** Publish a canonical event. tenantId/traceId default from the current trace context. */
  publish<T>(eventType: string, payload: T, meta?: { tenantId?: string | null; userId?: string | null }): Promise<void>;
  /** Durable subscription. `pattern` may use NATS wildcards (e.g. "billing.>"). */
  subscribe<T>(pattern: string, durable: string, handler: (e: SdkEvent<T>) => Promise<void> | void): Promise<EventSubscription>;
  close(): Promise<void>;
  /** Escape hatch to the underlying @baelbvion/events EventBus. */
  raw(): unknown;
}

export interface EventBusOptions {
  service: string;
  transport?: 'nats' | 'kafka' | 'redis' | 'noop';
  nats?: unknown;
  kafka?: unknown;
  trace?: TraceProvider;
  logger?: SdkLogger;
}

// ─────────────────────────────────────────────────────────────────────────────
// CACHE (pluggable) + small shared aliases
// ─────────────────────────────────────────────────────────────────────────────

export interface SdkCache {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  /** Delete an exact key, or all keys under a prefix when `prefix` is true. */
  del(key: string, prefix?: boolean): Promise<void>;
}

export type FetchLike = (input: string, init?: any) => Promise<any>;
export type SdkMiddleware = (req: any, res: any, next: any) => void;

// ─────────────────────────────────────────────────────────────────────────────
// THE UNIFIED SDK
// ─────────────────────────────────────────────────────────────────────────────

export interface SdkConfig {
  /** Owning service name (stamped on logs, traces, events, signed requests). */
  service: string;
  version?: string;
  /** CMS Integrations & Keys hub. */
  cms: { baseUrl: string; internalSecret: string; cacheTtlSeconds?: number };
  /** Service-to-service auth. */
  internalAuth: { secret: string; scheme?: InternalAuthScheme };
  /** Event bus transport (defaults to noop until NATS/Kafka/Redis is configured). */
  eventBus?: { transport: 'nats' | 'kafka' | 'redis' | 'noop'; nats?: unknown; kafka?: unknown };
  /** Resilient HTTP defaults. */
  http?: { defaultTimeoutMs?: number; defaultRetries?: number; circuitBreaker?: CircuitBreakerOptions | false };
  /** Pluggable cache for the config-resolver (defaults to in-memory). */
  cache?: SdkCache;
  logLevel?: string;
}

/** The single handle every service holds. All cross-cutting concerns hang off it. */
export interface PlatformSdk {
  service: string;
  config: ConfigResolver;
  internalAuth: InternalAuth;
  http: HttpClient;
  events: SdkEventBus;
  logger: SdkLogger;
  trace: TraceProvider;
  /** A tenant-bound view: secrets, events, and logs auto-scoped to one website/org. */
  forTenant(tenantSlug: string): TenantScopedSdk;
  /** Drain the event bus and release resources. */
  close(): Promise<void>;
}

/** Tenant-scoped convenience wrapper — the common case inside request handlers. */
export interface TenantScopedSdk {
  tenantSlug: string;
  getIntegration(provider: string): Promise<IntegrationConfig | null>;
  getSecret(provider: string, key: string): Promise<string | undefined>;
  getPaymentProvider(): Promise<IntegrationConfig | null>;
  http: HttpClient;
  events: { publish<T>(eventType: string, payload: T): Promise<void> };
  logger: SdkLogger;
}
