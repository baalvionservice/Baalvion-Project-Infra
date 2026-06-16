package com.baalvion.risk.config;

/**
 * Sanctions safety posture — deliberately INDEPENDENT of {@code app.security.enabled} (JWT). A service
 * may run with JWT off (gateway-trusted) yet still demand compliant watchlists, or vice-versa, so the
 * two switches must not be coupled.
 *
 * <ul>
 *   <li>{@link #STRICT} (default): production. Authoritative OFAC/UN/EU lists must be configured, loaded,
 *       and non-empty at boot or the service refuses to start; the dev seed list is forbidden; screening
 *       fails closed if the watchlist is empty. No mock/seed fallback exists in this flow.</li>
 *   <li>{@link #PERMISSIVE}: local/dev/test only. The offline seed list is allowed and boot never fails on
 *       an empty/missing watchlist. Must be opted into explicitly ({@code app.sanctions.enforcement=permissive}).</li>
 * </ul>
 */
public enum SanctionsEnforcement {
  STRICT,
  PERMISSIVE
}
