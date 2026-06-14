package com.baalvion.payment.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

/**
 * Provides a {@code RedisTemplate<String, Object>} bean for the idempotency store.
 *
 * Spring Boot's RedisAutoConfiguration only contributes a {@code RedisTemplate<Object,Object>}
 * and a {@code StringRedisTemplate}. Because Spring's autowiring is generic-aware, neither
 * satisfies an injection point typed {@code RedisTemplate<String,Object>} (as IdempotencyService
 * requires), so the context fails with "no qualifying bean". This defines the correctly-typed
 * template with String keys and JSON-serialized values.
 */
@Configuration
public class RedisConfig {

  @Bean
  public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
    RedisTemplate<String, Object> template = new RedisTemplate<>();
    template.setConnectionFactory(connectionFactory);
    StringRedisSerializer keySerializer = new StringRedisSerializer();
    GenericJackson2JsonRedisSerializer valueSerializer = new GenericJackson2JsonRedisSerializer();
    template.setKeySerializer(keySerializer);
    template.setHashKeySerializer(keySerializer);
    template.setValueSerializer(valueSerializer);
    template.setHashValueSerializer(valueSerializer);
    template.afterPropertiesSet();
    return template;
  }
}
