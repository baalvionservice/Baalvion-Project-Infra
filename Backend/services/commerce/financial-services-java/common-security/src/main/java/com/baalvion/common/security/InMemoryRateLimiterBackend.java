package com.baalvion.common.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;

import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * Per-instance token-bucket rate limiter (Bucket4j). Default backend; correct for a single
 * replica. For a cluster-wide limit use {@link RedisRateLimiterBackend}.
 */
public class InMemoryRateLimiterBackend implements RateLimiterBackend {

  private final SecurityProperties.RateLimit config;
  private final ConcurrentMap<String, Bucket> buckets = new ConcurrentHashMap<>();

  public InMemoryRateLimiterBackend(SecurityProperties.RateLimit config) {
    this.config = config;
  }

  @Override
  public boolean tryAcquire(String key) {
    return buckets.computeIfAbsent(key, k -> newBucket()).tryConsume(1);
  }

  private Bucket newBucket() {
    Refill refill = Refill.greedy(config.getRefillTokens(), Duration.ofSeconds(config.getRefillPeriodSeconds()));
    Bandwidth limit = Bandwidth.classic(config.getCapacity(), refill);
    return Bucket.builder().addLimit(limit).build();
  }
}
