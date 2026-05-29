package com.baalvion.common.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.time.Duration;
import java.time.Instant;

/**
 * Cluster-wide fixed-window rate limiter backed by Redis (design §7.2): all replicas share the
 * same counter via {@code INCR} + {@code EXPIRE}, keyed by client and window. Fails open
 * (allows the request) if Redis is unavailable, so a limiter outage never blocks legitimate
 * traffic — the outage is alerted on separately.
 */
public class RedisRateLimiterBackend implements RateLimiterBackend {

  private static final Logger log = LoggerFactory.getLogger(RedisRateLimiterBackend.class);

  private final StringRedisTemplate redis;
  private final long capacity;
  private final long windowSeconds;

  public RedisRateLimiterBackend(StringRedisTemplate redis, SecurityProperties.RateLimit config) {
    this.redis = redis;
    this.capacity = config.getCapacity();
    this.windowSeconds = config.getRefillPeriodSeconds();
  }

  @Override
  public boolean tryAcquire(String key) {
    long window = Instant.now().getEpochSecond() / windowSeconds;
    String redisKey = "rl:" + key + ":" + window;
    try {
      Long count = redis.opsForValue().increment(redisKey);
      if (count != null && count == 1L) {
        redis.expire(redisKey, Duration.ofSeconds(windowSeconds));
      }
      return count == null || count <= capacity;
    } catch (Exception e) {
      log.warn("Redis rate-limit backend unavailable, failing open: {}", e.getMessage());
      return true;
    }
  }
}
