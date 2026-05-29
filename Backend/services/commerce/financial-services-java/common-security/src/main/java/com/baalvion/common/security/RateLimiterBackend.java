package com.baalvion.common.security;

/**
 * Pluggable rate-limit store. Per-instance (in-memory) by default; a Redis-backed
 * implementation gives a cluster-wide limit shared across replicas (design §7.2).
 */
public interface RateLimiterBackend {

  /**
   * @param key client identity (auth subject or IP)
   * @return true if the request is within the limit and should proceed
   */
  boolean tryAcquire(String key);
}
