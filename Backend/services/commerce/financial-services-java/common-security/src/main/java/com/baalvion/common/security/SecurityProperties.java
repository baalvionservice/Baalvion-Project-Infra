package com.baalvion.common.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;

/**
 * Typed configuration for the shared security layer (prefix {@code app.security}).
 *
 * Secure by default: JWT validation is ON unless {@code app.security.enabled=false}
 * (intended only for local/dev). All sub-features default to non-restrictive values so a
 * service boots cleanly and is hardened purely through configuration.
 */
@ConfigurationProperties(prefix = "app.security")
public class SecurityProperties {

  /** Master switch. True => RS256 resource server enforced; requires an issuer/jwk config. */
  private boolean enabled = true;

  private final RateLimit rateLimit = new RateLimit();
  private final Ip ip = new Ip();
  private final Mfa mfa = new Mfa();
  private final Claims claims = new Claims();

  public boolean isEnabled() { return enabled; }
  public void setEnabled(boolean enabled) { this.enabled = enabled; }
  public RateLimit getRateLimit() { return rateLimit; }
  public Ip getIp() { return ip; }
  public Mfa getMfa() { return mfa; }
  public Claims getClaims() { return claims; }

  /** Token-bucket rate limiting (Bucket4j), keyed by JWT subject or client IP. */
  public static class RateLimit {
    private boolean enabled = true;
    /** Backend: "memory" (per-instance Bucket4j) or "redis" (cluster-wide fixed window). */
    private String backend = "memory";
    /** Bucket capacity (burst). */
    private long capacity = 200;
    /** Tokens refilled per {@link #refillPeriodSeconds}. */
    private long refillTokens = 200;
    private long refillPeriodSeconds = 60;
    /** Paths exempt from rate limiting (e.g., actuator). */
    private List<String> excludePaths = new ArrayList<>(List.of("/actuator"));

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public String getBackend() { return backend; }
    public void setBackend(String backend) { this.backend = backend; }
    public long getCapacity() { return capacity; }
    public void setCapacity(long capacity) { this.capacity = capacity; }
    public long getRefillTokens() { return refillTokens; }
    public void setRefillTokens(long refillTokens) { this.refillTokens = refillTokens; }
    public long getRefillPeriodSeconds() { return refillPeriodSeconds; }
    public void setRefillPeriodSeconds(long refillPeriodSeconds) { this.refillPeriodSeconds = refillPeriodSeconds; }
    public List<String> getExcludePaths() { return excludePaths; }
    public void setExcludePaths(List<String> excludePaths) { this.excludePaths = excludePaths; }
  }

  /** IP allowlisting for sensitive path prefixes (design §7.2). Empty allowlist => allow all. */
  public static class Ip {
    /** CIDRs / exact IPs permitted to call the protected paths. Empty => no restriction. */
    private List<String> allowlist = new ArrayList<>();
    /** Path prefixes the allowlist applies to (e.g., /api/v1/audit/dlt). */
    private List<String> protectedPaths = new ArrayList<>();

    public List<String> getAllowlist() { return allowlist; }
    public void setAllowlist(List<String> allowlist) { this.allowlist = allowlist; }
    public List<String> getProtectedPaths() { return protectedPaths; }
    public void setProtectedPaths(List<String> protectedPaths) { this.protectedPaths = protectedPaths; }
  }

  /** MFA/TOTP enforcement on privileged path prefixes (design §7.1). */
  public static class Mfa {
    /** Path prefixes that require a valid TOTP code when the caller has an enrolled secret. */
    private List<String> protectedPaths = new ArrayList<>();
    private String header = "X-MFA-Code";

    public List<String> getProtectedPaths() { return protectedPaths; }
    public void setProtectedPaths(List<String> protectedPaths) { this.protectedPaths = protectedPaths; }
    public String getHeader() { return header; }
    public void setHeader(String header) { this.header = header; }
  }

  /** JWT claim names used to derive identity/tenant/authorities (gateway-contract aligned). */
  public static class Claims {
    /** Ordered candidates for the tenant/org id claim. */
    private List<String> tenant = new ArrayList<>(List.of("org_id", "orgId", "tenant_id", "tenantId"));
    private String user = "sub";
    private String roles = "roles";
    private String permissions = "permissions";

    public List<String> getTenant() { return tenant; }
    public void setTenant(List<String> tenant) { this.tenant = tenant; }
    public String getUser() { return user; }
    public void setUser(String user) { this.user = user; }
    public String getRoles() { return roles; }
    public void setRoles(String roles) { this.roles = roles; }
    public String getPermissions() { return permissions; }
    public void setPermissions(String permissions) { this.permissions = permissions; }
  }
}
