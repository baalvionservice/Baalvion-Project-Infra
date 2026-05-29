package com.baalvion.common.security;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.springframework.security.access.AccessDeniedException;

/**
 * ABAC owner-or-role decision tests (pure JUnit). Drives {@link AuthContext} via a stubbed
 * Spring SecurityContext — no infrastructure required.
 */
class AbacPolicyTest {

  private final AbacPolicy abac = new AbacPolicy();

  @AfterEach
  void clear() {
    SecurityContextHolder.clearContext();
  }

  private void authenticateAs(String userId, String... roles) {
    Jwt jwt = Jwt.withTokenValue("test-token")
      .header("alg", "none")
      .subject(userId)
      .claim("sub", userId)
      .build();
    var authorities = AuthorityUtils.createAuthorityList(roles); // pass e.g. "ROLE_ADMIN"
    SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(jwt, authorities));
  }

  @Test
  void unauthenticatedIsPermissive() {
    // No JWT in context (e.g. security disabled in dev) -> permit.
    assertThat(abac.ownerOrRole("anyone")).isTrue();
  }

  @Test
  void nonJwtAuthenticationIsTreatedAsUnauthenticated() {
    SecurityContextHolder.getContext().setAuthentication(
      new AnonymousAuthenticationToken("k", "anon", AuthorityUtils.createAuthorityList("ROLE_ANONYMOUS")));
    assertThat(abac.ownerOrRole("someone-else")).isTrue();
  }

  @Test
  void ownerIsPermitted() {
    authenticateAs("user-1");
    assertThat(abac.ownerOrRole("user-1")).isTrue();
  }

  @Test
  void nonOwnerWithoutRoleIsDenied() {
    authenticateAs("user-2");
    assertThat(abac.ownerOrRole("user-1", "ADMIN", "OPERATOR")).isFalse();
    assertThatThrownBy(() -> abac.requireOwnerOrRole("user-1", "ADMIN"))
      .isInstanceOf(AccessDeniedException.class);
  }

  @Test
  void nonOwnerWithOverrideRoleIsPermitted() {
    authenticateAs("user-2", "ROLE_ADMIN");
    assertThat(abac.ownerOrRole("user-1", "ADMIN")).isTrue();
    abac.requireOwnerOrRole("user-1", "ADMIN"); // does not throw
  }
}
