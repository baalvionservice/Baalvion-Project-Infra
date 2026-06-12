// Type declarations for @baalvion/resilience (implementation is plain JS).

export type CircuitState = 'closed' | 'open' | 'half_open';
export const CIRCUIT_STATES: { CLOSED: 'closed'; OPEN: 'open'; HALF_OPEN: 'half_open' };

export class CircuitOpenError extends Error {
  code: 'CIRCUIT_OPEN';
  statusCode: 503;
}

export interface CircuitBreakerOptions {
  name?: string;
  failureThreshold?: number;
  resetTimeoutMs?: number;
  halfOpenMax?: number;
  isFailure?: (err: unknown) => boolean;
  onStateChange?: (t: { name: string; from: CircuitState; to: CircuitState }) => void;
  now?: () => number;
}

export class CircuitBreaker {
  constructor(opts?: CircuitBreakerOptions);
  readonly state: CircuitState;
  readonly stats: { name: string; state: CircuitState; failures: number; nextAttempt: number };
  exec<T>(fn: () => Promise<T>): Promise<T>;
}

export class AbortError extends Error {
  code: 'ABORTED';
}

export interface RetryOptions {
  retries?: number;
  minDelayMs?: number;
  maxDelayMs?: number;
  factor?: number;
  jitter?: boolean;
  retryable?: (err: unknown, attempt: number) => boolean;
  onRetry?: (info: { attempt: number; delay: number; error: unknown }) => void;
  signal?: AbortSignal;
  sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
  random?: () => number;
}

export function withRetry<T>(fn: (attempt: number) => Promise<T>, opts?: RetryOptions): Promise<T>;

export class TimeoutError extends Error {
  code: 'TIMEOUT';
  statusCode: 504;
}

export function withTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  ms: number,
  opts?: { signal?: AbortSignal; onTimeout?: () => void },
): Promise<T>;

export class BulkheadFullError extends Error {
  code: 'BULKHEAD_FULL';
  statusCode: 429;
}

export interface BulkheadOptions {
  name?: string;
  maxConcurrent?: number;
  maxQueue?: number;
}

export class Bulkhead {
  constructor(opts?: BulkheadOptions);
  readonly active: number;
  readonly queued: number;
  exec<T>(fn: () => Promise<T>, opts?: { signal?: AbortSignal }): Promise<T>;
}

export interface RateLimitStore {
  incr(key: string, windowMs: number, now: number): Promise<{ count: number; resetAt: number }>;
}

export interface RateLimiterOptions {
  windowMs?: number;
  max?: number;
  keyPrefix?: string;
  store?: RateLimitStore;
  redis?: { eval: (...args: any[]) => Promise<any> };
  now?: () => number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterMs: number;
}

export class RateLimiter {
  constructor(opts?: RateLimiterOptions);
  readonly max: number;
  consume(id: string): Promise<RateLimitResult>;
  middleware(opts?: { keyGenerator?: (req: any) => string }): (req: any, res: any, next: any) => void;
}

export class MemoryStore implements RateLimitStore {
  incr(key: string, windowMs: number, now: number): Promise<{ count: number; resetAt: number }>;
}

export class RedisStore implements RateLimitStore {
  constructor(redis: { eval: (...args: any[]) => Promise<any> });
  incr(key: string, windowMs: number, now: number): Promise<{ count: number; resetAt: number }>;
}

export const FIXED_WINDOW_LUA: string;

export interface ResilientOptions {
  circuitBreaker?: CircuitBreakerOptions | false;
  retry?: RetryOptions | false;
  timeoutMs?: number;
  bulkhead?: BulkheadOptions | Bulkhead | false;
}

export type ResilientFn<A extends any[], T> = ((...args: A) => Promise<T>) & {
  breaker?: CircuitBreaker;
  bulkhead?: Bulkhead;
};

export function createResilient<A extends any[], T>(
  fn: (...args: A) => Promise<T>,
  opts?: ResilientOptions,
): ResilientFn<A, T>;
