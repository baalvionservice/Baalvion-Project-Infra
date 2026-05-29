package com.baalvion.common.security;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

/**
 * Shared security for the financial services (design §7), auto-configured via
 * {@code AutoConfiguration.imports} — a service only needs the {@code common-security}
 * dependency.
 *
 * SECURE BY DEFAULT: unless {@code app.security.enabled=false} (local/dev), every {@code /api/**}
 * request requires a valid RS256 JWT. Tenant + identity are taken from the token (see
 * {@link AuthContext}/{@link TenantContext}) — a client-supplied {@code X-Tenant-ID} is never
 * trusted when authenticated. Roles/permissions claims map to authorities (RBAC).
 *
 * Cross-cutting capabilities are always present and tuned purely by config:
 *   - correlation-id propagation (§10.1)
 *   - Bucket4j rate limiting (§7.2)
 *   - IP allowlisting for sensitive paths (§7.2)
 *   - TOTP/MFA enforcement on privileged paths (§7.1) — inert until an {@link MfaSecretStore} is wired
 *   - {@link AbacPolicy} for attribute-based decisions (§7.1)
 */
@AutoConfiguration
@ConditionalOnClass(SecurityFilterChain.class)
@EnableConfigurationProperties(SecurityProperties.class)
public class BaalvionSecurityAutoConfiguration {

  private final SecurityProperties properties;

  @Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri:}")
  private String issuerUri;

  @Value("${spring.security.oauth2.resourceserver.jwt.jwk-set-uri:}")
  private String jwkSetUri;

  public BaalvionSecurityAutoConfiguration(SecurityProperties properties) {
    this.properties = properties;
  }

  @PostConstruct
  void init() {
    AuthContext.configure(properties.getClaims());
  }

  // ---- always-on cross-cutting beans (registered as servlet filters, ordered by @Order) ----

  @Bean
  public CorrelationIdFilter correlationIdFilter() {
    return new CorrelationIdFilter();
  }

  @Bean
  @ConditionalOnProperty(name = "app.security.rate-limit.backend", havingValue = "redis")
  public RateLimiterBackend redisRateLimiterBackend(org.springframework.data.redis.core.StringRedisTemplate redis) {
    return new RedisRateLimiterBackend(redis, properties.getRateLimit());
  }

  @Bean
  @ConditionalOnMissingBean(RateLimiterBackend.class)
  public RateLimiterBackend inMemoryRateLimiterBackend() {
    return new InMemoryRateLimiterBackend(properties.getRateLimit());
  }

  @Bean
  @ConditionalOnProperty(name = "app.security.rate-limit.enabled", havingValue = "true", matchIfMissing = true)
  public RateLimitFilter rateLimitFilter(RateLimiterBackend rateLimiterBackend) {
    return new RateLimitFilter(properties.getRateLimit(), rateLimiterBackend);
  }

  @Bean
  public IpAllowlistFilter ipAllowlistFilter() {
    return new IpAllowlistFilter(properties.getIp());
  }

  @Bean
  public TotpService totpService() {
    return new TotpService();
  }

  @Bean("abac")
  public AbacPolicy abacPolicy() {
    return new AbacPolicy();
  }

  @Bean
  @ConditionalOnMissingBean(MfaSecretStore.class)
  public MfaSecretStore mfaSecretStore() {
    return new MfaSecretStore.NotEnrolled();
  }

  /**
   * Shared OpenAPI document for every service: declares the HTTP-bearer (JWT) security scheme so
   * Swagger UI offers an "Authorize" box and the spec advertises that all endpoints are secured.
   * Inert unless springdoc/swagger is on the classpath; a service may override with its own bean.
   */
  @Bean
  @ConditionalOnClass(io.swagger.v3.oas.models.OpenAPI.class)
  @ConditionalOnMissingBean(io.swagger.v3.oas.models.OpenAPI.class)
  public io.swagger.v3.oas.models.OpenAPI baalvionOpenApi(
      @Value("${spring.application.name:baalvion-service}") String serviceName) {
    final String scheme = "bearer-jwt";
    return new io.swagger.v3.oas.models.OpenAPI()
      .info(new io.swagger.v3.oas.models.info.Info()
        .title(serviceName + " API")
        .version("1.0.0")
        .description("Baalvion financial platform service. All /api/** endpoints require a "
          + "bearer RS256 JWT; tenant identity is derived from the token."))
      .addSecurityItem(new io.swagger.v3.oas.models.security.SecurityRequirement().addList(scheme))
      .components(new io.swagger.v3.oas.models.Components().addSecuritySchemes(scheme,
        new io.swagger.v3.oas.models.security.SecurityScheme()
          .type(io.swagger.v3.oas.models.security.SecurityScheme.Type.HTTP)
          .scheme("bearer")
          .bearerFormat("JWT")));
  }

  // ---- security filter chains (mutually exclusive) ----

  @Bean
  @ConditionalOnProperty(name = "app.security.enabled", havingValue = "true", matchIfMissing = true)
  public SecurityFilterChain securedFilterChain(HttpSecurity http, MfaSecretStore mfaSecretStore, TotpService totpService) throws Exception {
    if ((issuerUri == null || issuerUri.isBlank()) && (jwkSetUri == null || jwkSetUri.isBlank())) {
      throw new IllegalStateException(
        "app.security.enabled=true requires spring.security.oauth2.resourceserver.jwt.issuer-uri "
          + "or jwk-set-uri (set OAUTH_ISSUER_URI / OAUTH_JWK_SET_URI). Use app.security.enabled=false for local/dev.");
    }
    http
      .csrf(csrf -> csrf.disable())
      .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
      .authorizeHttpRequests(auth -> auth
        .requestMatchers("/actuator/health/**", "/actuator/info", "/actuator/prometheus").permitAll()
        .requestMatchers("/actuator/**").hasRole("OPERATOR")
        // OpenAPI/Swagger UI (turn off in prod with springdoc.api-docs.enabled / swagger-ui.enabled=false)
        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
        .anyRequest().authenticated())
      .oauth2ResourceServer(oauth -> oauth.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter())))
      // MFA runs after bearer authentication so the authenticated principal is available.
      .addFilterAfter(new MfaVerificationFilter(properties.getMfa(), mfaSecretStore, totpService),
        BearerTokenAuthenticationFilter.class);
    return http.build();
  }

  @Bean
  @ConditionalOnProperty(name = "app.security.enabled", havingValue = "false")
  public SecurityFilterChain permissiveFilterChain(HttpSecurity http) throws Exception {
    http
      .csrf(csrf -> csrf.disable())
      .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
    return http.build();
  }

  private JwtAuthenticationConverter jwtAuthenticationConverter() {
    JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
    converter.setJwtGrantedAuthoritiesConverter(this::extractAuthorities);
    return converter;
  }

  private Collection<GrantedAuthority> extractAuthorities(Jwt jwt) {
    Collection<GrantedAuthority> authorities = new ArrayList<>();
    addAll(authorities, jwt.getClaim(properties.getClaims().getRoles()), "ROLE_");
    addAll(authorities, jwt.getClaim(properties.getClaims().getPermissions()), "");
    return authorities;
  }

  private void addAll(Collection<GrantedAuthority> target, Object claim, String prefix) {
    if (claim instanceof Collection<?> values) {
      for (Object value : values) {
        if (value != null) {
          target.add(new SimpleGrantedAuthority(prefix + value));
        }
      }
    } else if (claim instanceof String s && !s.isBlank()) {
      for (String value : List.of(s.split("[ ,]+"))) {
        target.add(new SimpleGrantedAuthority(prefix + value));
      }
    }
  }
}
