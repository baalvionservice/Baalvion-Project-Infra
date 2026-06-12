'use strict';

/**
 * @baalvion/resilience — transport-agnostic resilience primitives.
 *
 * These wrap ANY async operation (DB query, vendor SDK call, queue publish,
 * outbound HTTP) — they are not coupled to HTTP. The platform's @baalvion/sdk
 * already has an HTTP-specific breaker; this package is the reusable core for
 * everything else (and for composing your own resilient clients).
 */

const { CircuitBreaker, CircuitOpenError, CIRCUIT_STATES } = require('./circuit-breaker');
const { withRetry, AbortError } = require('./retry');
const { withTimeout, TimeoutError } = require('./timeout');
const { Bulkhead, BulkheadFullError } = require('./bulkhead');
const { RateLimiter, MemoryStore, RedisStore, FIXED_WINDOW_LUA } = require('./rate-limit');
const { createResilient } = require('./resilient');

module.exports = {
  CircuitBreaker,
  CircuitOpenError,
  CIRCUIT_STATES,
  withRetry,
  AbortError,
  withTimeout,
  TimeoutError,
  Bulkhead,
  BulkheadFullError,
  RateLimiter,
  MemoryStore,
  RedisStore,
  FIXED_WINDOW_LUA,
  createResilient,
};
