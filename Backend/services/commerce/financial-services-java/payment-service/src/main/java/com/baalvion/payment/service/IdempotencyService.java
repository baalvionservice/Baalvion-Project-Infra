package com.baalvion.payment.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class IdempotencyService {

  private final RedisTemplate<String, Object> redisTemplate;
  private final ObjectMapper objectMapper;

  @Value("${app.idempotency-ttl:86400}")
  private long idempotencyTtl;

  public IdempotencyService(RedisTemplate<String, Object> redisTemplate, ObjectMapper objectMapper) {
    this.redisTemplate = redisTemplate;
    this.objectMapper = objectMapper;
  }

  public Optional<String> getResult(UUID tenantId, String key) {
    String cacheKey = buildCacheKey(tenantId, key);
    try {
      String result = (String) redisTemplate.opsForValue().get(cacheKey);
      if (result != null) {
        log.info("Idempotency hit: tenant={}, key={}", tenantId, key);
        return Optional.of(result);
      }
    } catch (Exception e) {
      log.warn("Idempotency check failed: {}", e.getMessage());
    }
    return Optional.empty();
  }

  public void storeResult(UUID tenantId, String key, Object result) {
    String cacheKey = buildCacheKey(tenantId, key);
    try {
      String serialized = objectMapper.writeValueAsString(result);
      redisTemplate.opsForValue().set(cacheKey, serialized, idempotencyTtl, TimeUnit.SECONDS);
      log.info("Idempotency stored: tenant={}, key={}, ttl={}s", tenantId, key, idempotencyTtl);
    } catch (Exception e) {
      log.warn("Failed to store idempotency result: {}", e.getMessage());
    }
  }

  private String buildCacheKey(UUID tenantId, String key) {
    return "idempotency:" + tenantId + ":" + key;
  }
}
