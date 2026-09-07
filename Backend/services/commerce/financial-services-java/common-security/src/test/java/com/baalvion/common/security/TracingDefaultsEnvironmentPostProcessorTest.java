package com.baalvion.common.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Resolution of the JWKS alias. {@code app.security.enabled=true} makes the secured filter chain
 * throw at startup unless a jwk-set-uri (or issuer-uri) is present, so which env names are honoured
 * here decides whether a service can boot secured at all.
 */
class TracingDefaultsEnvironmentPostProcessorTest {

  private static final String JWK_PROPERTY = "spring.security.oauth2.resourceserver.jwt.jwk-set-uri";

  private String resolveJwkSetUri(MockEnvironment environment) {
    new TracingDefaultsEnvironmentPostProcessor().postProcessEnvironment(environment, null);
    return environment.getProperty(JWK_PROPERTY);
  }

  @Test
  void readsTheExplicitOauthAlias() {
    MockEnvironment env = new MockEnvironment().withProperty("OAUTH_JWK_SET_URI", "https://idp/jwks.json");
    assertThat(resolveJwkSetUri(env)).isEqualTo("https://idp/jwks.json");
  }

  @Test
  void fallsBackToThePlatformStandardJwksUri() {
    // Every container on the platform sets JWKS_URI, not OAUTH_JWK_SET_URI.
    MockEnvironment env = new MockEnvironment().withProperty("JWKS_URI", "http://app-identity:3001/.well-known/jwks.json");
    assertThat(resolveJwkSetUri(env)).isEqualTo("http://app-identity:3001/.well-known/jwks.json");
  }

  @Test
  void prefersTheExplicitAliasOverTheFallback() {
    MockEnvironment env = new MockEnvironment()
      .withProperty("OAUTH_JWK_SET_URI", "https://explicit/jwks.json")
      .withProperty("JWKS_URI", "https://fallback/jwks.json");
    assertThat(resolveJwkSetUri(env)).isEqualTo("https://explicit/jwks.json");
  }

  @Test
  void ignoresABlankAliasAndUsesTheFallback() {
    // An unset variable interpolated by compose arrives as "" rather than absent.
    MockEnvironment env = new MockEnvironment()
      .withProperty("OAUTH_JWK_SET_URI", "")
      .withProperty("JWKS_URI", "https://fallback/jwks.json");
    assertThat(resolveJwkSetUri(env)).isEqualTo("https://fallback/jwks.json");
  }

  @Test
  void contributesNothingWhenNeitherIsSet() {
    assertThat(resolveJwkSetUri(new MockEnvironment())).isNull();
  }

  @Test
  void tracingStaysOffByDefault() {
    MockEnvironment env = new MockEnvironment();
    new TracingDefaultsEnvironmentPostProcessor().postProcessEnvironment(env, null);
    assertThat(env.getProperty("management.tracing.sampling.probability")).isEqualTo("0.0");
  }
}
