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
 *  - short OAuth2 issuer aliases: {@code OAUTH_ISSUER_URI} / {@code OAUTH_JWK_SET_URI} (falling
 *    back to the platform-standard {@code JWKS_URI}) → {@code spring.security.oauth2
 *    .resourceserver.jwt.issuer-uri} / {@code .jwk-set-uri}, so operators don't need the long
 *    property names to point the resource server at the platform IdP/JWKS. ({@code APP_SECURITY_ENABLED} already maps to {@code app.security.enabled}
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
    // JWKS_URI is the name the rest of the platform already uses (every Node service and every
    // container env sets it), so accept it as a fallback. Without this only payment-service — which
    // spells the fallback out in its own yml — could start with app.security.enabled=true; the other
    // twenty threw IllegalStateException on boot, which is why security was off in production.
    String jwkSet = firstNonBlank(environment.getProperty("OAUTH_JWK_SET_URI"), environment.getProperty("JWKS_URI"));
    if (jwkSet != null) {
      defaults.put("spring.security.oauth2.resourceserver.jwt.jwk-set-uri", jwkSet);
    }

    environment.getPropertySources().addLast(new MapPropertySource("baalvion-platform-defaults", defaults));
  }

  private static String firstNonBlank(String... values) {
    for (String v : values) {
      if (v != null && !v.isBlank()) {
        return v;
      }
    }
    return null;
  }
}
