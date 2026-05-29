package com.baalvion.common.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Read-only accessor for the authenticated principal, derived from the validated JWT in
 * the Spring Security context. Centralises claim extraction so services never parse tokens
 * or trust client-supplied identity headers.
 *
 * Claim names are resolved from {@link SecurityProperties.Claims} via {@link #configure}.
 * Returns empty/anonymous values when unauthenticated (e.g., security disabled in dev).
 */
public final class AuthContext {

  private static volatile SecurityProperties.Claims claims = new SecurityProperties.Claims();

  private AuthContext() {}

  static void configure(SecurityProperties.Claims configured) {
    if (configured != null) {
      claims = configured;
    }
  }

  /** The current JWT, if the request is authenticated with a bearer token. */
  public static Optional<Jwt> currentJwt() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth instanceof JwtAuthenticationToken jwtAuth) {
      return Optional.of(jwtAuth.getToken());
    }
    return Optional.empty();
  }

  public static boolean isAuthenticated() {
    return currentJwt().isPresent();
  }

  /** Tenant/org id from the first matching configured claim, or empty when unauthenticated. */
  public static Optional<UUID> currentTenantId() {
    return currentJwt().flatMap(AuthContext::tenantFrom);
  }

  static Optional<UUID> tenantFrom(Jwt jwt) {
    for (String claim : claims.getTenant()) {
      Object value = jwt.getClaim(claim);
      if (value != null && !value.toString().isBlank()) {
        try {
          return Optional.of(UUID.fromString(value.toString()));
        } catch (IllegalArgumentException ignored) {
          // not a UUID-shaped tenant claim; try the next candidate
        }
      }
    }
    return Optional.empty();
  }

  /** Authenticated user/subject id (the {@code sub} claim by default). */
  public static Optional<String> currentUserId() {
    return currentJwt().map(jwt -> {
      Object v = jwt.getClaim(claims.getUser());
      return v != null ? v.toString() : jwt.getSubject();
    });
  }

  public static List<String> authorities() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null) {
      return List.of();
    }
    return auth.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList();
  }

  public static boolean hasRole(String role) {
    return authorities().contains("ROLE_" + role);
  }

  public static boolean hasAuthority(String authority) {
    return authorities().contains(authority);
  }
}
