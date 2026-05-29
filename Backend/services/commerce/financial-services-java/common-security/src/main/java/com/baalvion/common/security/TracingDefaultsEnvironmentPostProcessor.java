package com.baalvion.common.security;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.util.HashMap;
import java.util.Map;

/**
 * Platform-wide environment defaults + convenience env aliases for every financial service
 * that depends on common-security. Added at LOWEST precedence, so anything set explicitly
 * (yml/env) overrides it.
 *
 * Provides:
 *  - {@code management.tracing.sampling.probability=0.0} — OTLP is on the classpath (§10.4)
 *    but exports nothing until an operator opts in.
 *  - short OAuth2 issuer aliases: {@code OAUTH_ISSUER_URI} / {@code OAUTH_JWK_SET_URI} →
 *    {@code spring.security.oauth2.resourceserver.jwt.issuer-uri} / {@code .jwk-set-uri},
 *    so operators don't need the long property names to point the resource server at the
 *    platform IdP/JWKS. ({@code APP_SECURITY_ENABLED} already maps to {@code app.security.enabled}
 *    via Spring relaxed binding.)
 */
public class TracingDefaultsEnvironmentPostProcessor implements EnvironmentPostProcessor {

  @Override
  public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
    Map<String, Object> defaults = new HashMap<>();
    defaults.put("management.tracing.sampling.probability", "0.0");
    // Redis (optional rate-limit backend) and Elasticsearch (optional audit search) are on some
    // classpaths but unused by default; keep their health indicators off so services without
    // those backends don't fail readiness probes.
    defaults.put("management.health.redis.enabled", "false");
    defaults.put("management.health.elasticsearch.enabled", "false");

    String issuer = environment.getProperty("OAUTH_ISSUER_URI");
    if (issuer != null && !issuer.isBlank()) {
      defaults.put("spring.security.oauth2.resourceserver.jwt.issuer-uri", issuer);
    }
    String jwkSet = environment.getProperty("OAUTH_JWK_SET_URI");
    if (jwkSet != null && !jwkSet.isBlank()) {
      defaults.put("spring.security.oauth2.resourceserver.jwt.jwk-set-uri", jwkSet);
    }

    environment.getPropertySources().addLast(new MapPropertySource("baalvion-platform-defaults", defaults));
  }
}
