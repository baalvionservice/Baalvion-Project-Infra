package com.baalvion.common.security;

import org.springframework.security.access.AccessDeniedException;

import java.util.UUID;

/**
 * Resolves the tenant for the current request.
 *
 * Trust model (design §7.4 IDOR control): when the request is authenticated, the tenant is
 * taken EXCLUSIVELY from the validated JWT — any client-supplied {@code X-Tenant-ID} header
 * is ignored, so a caller can never act on another tenant by spoofing the header. The header
 * is honoured only as a fallback when security is disabled (local/dev), where requests are
 * unauthenticated.
 */
public final class TenantContext {

  /** Sentinel tenant for unauthenticated dev requests with no header. */
  public static final UUID SYSTEM_TENANT = UUID.fromString("00000000-0000-0000-0000-000000000000");

  private TenantContext() {}

  /**
   * @param headerTenant the raw {@code X-Tenant-ID} header value (may be null/blank)
   * @return the authoritative tenant id for this request
   */
  public static UUID resolve(String headerTenant) {
    if (AuthContext.isAuthenticated()) {
      // Authenticated: the tenant comes EXCLUSIVELY from the validated token. A token that carries no
      // usable tenant claim must NOT fall back to the client-supplied header — doing so would let an
      // authenticated caller act on an arbitrary tenant by spoofing X-Tenant-ID. Fail closed instead.
      return AuthContext.currentTenantId().orElseThrow(() -> new AccessDeniedException(
        "Authenticated request carries no tenant claim; refusing to resolve tenant from X-Tenant-ID"));
    }
    // Unauthenticated (security disabled / local dev): the header is the only available signal.
    return fromHeaderOrSystem(headerTenant);
  }

  private static UUID fromHeaderOrSystem(String headerTenant) {
    if (headerTenant != null && !headerTenant.isBlank()) {
      return UUID.fromString(headerTenant);
    }
    return SYSTEM_TENANT;
  }
}
