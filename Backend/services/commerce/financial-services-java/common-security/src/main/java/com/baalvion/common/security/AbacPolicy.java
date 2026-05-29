package com.baalvion.common.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;

/**
 * Attribute-Based Access Control foundation (design §7.1).
 *
 * Programmatic policy hook used by services for fine-grained, attribute-driven decisions
 * (e.g., "only the initiator or an admin may reverse a transaction"). Evaluated only when a
 * request is authenticated; when security is disabled (dev, unauthenticated) the policies
 * are permissive so local flows are unaffected.
 *
 * Registered as bean {@code abac} by {@code BaalvionSecurityAutoConfiguration}, usable from
 * SpEL where a consuming service enables method security.
 */
public class AbacPolicy {

  private static final Logger log = LoggerFactory.getLogger(AbacPolicy.class);

  /**
   * Owner-or-role rule: permit when unauthenticated (dev), when the caller is the resource
   * owner, or when the caller holds any of the override roles.
   */
  public boolean ownerOrRole(String ownerUserId, String... overrideRoles) {
    if (!AuthContext.isAuthenticated()) {
      return true;
    }
    String caller = AuthContext.currentUserId().orElse(null);
    if (caller != null && caller.equals(ownerUserId)) {
      return true;
    }
    for (String role : overrideRoles) {
      if (AuthContext.hasRole(role)) {
        return true;
      }
    }
    return false;
  }

  /** Enforcing variant — throws {@link AccessDeniedException} (→ 403) when the rule fails. */
  public void requireOwnerOrRole(String ownerUserId, String... overrideRoles) {
    if (!ownerOrRole(ownerUserId, overrideRoles)) {
      log.warn("ABAC denied: caller {} is neither owner {} nor holds {}",
        AuthContext.currentUserId().orElse("?"), ownerUserId, String.join("/", overrideRoles));
      throw new AccessDeniedException("Not permitted for this resource");
    }
  }
}
