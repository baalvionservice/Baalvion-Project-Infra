package com.baalvion.common.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;

/**
 * Server-to-server authentication via a shared internal secret ({@code x-internal-secret}).
 *
 * <p>Trusted Baalvion services (e.g. the Node BFF calling the PSP gateway, or the CMS)
 * authenticate to each other with a pre-shared secret instead of a user JWT. When the header
 * matches the configured secret, this filter establishes an authenticated principal bearing
 * {@code ROLE_INTERNAL} so the security chain can authorize internal-only paths
 * (e.g. {@code /v1/gateway/payments/**}) WITHOUT exposing them publicly. Webhooks remain
 * {@code permitAll} (their authenticity is the provider signature), and {@code /api/**} still
 * requires a user RS256 JWT.
 *
 * <p>Runs before the bearer-token filter; if a valid user JWT is also present that path wins
 * (this only acts when no authentication is set yet). The comparison is constant-time.
 */
public class InternalServiceAuthFilter extends OncePerRequestFilter {

  public static final String HEADER = "x-internal-secret";
  public static final String ROLE = "ROLE_INTERNAL";

  private final byte[] secretBytes;

  public InternalServiceAuthFilter(String secret) {
    this.secretBytes = (secret == null) ? new byte[0] : secret.getBytes(StandardCharsets.UTF_8);
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
      throws ServletException, IOException {
    if (secretBytes.length > 0 && SecurityContextHolder.getContext().getAuthentication() == null) {
      String provided = request.getHeader(HEADER);
      if (provided != null && constantTimeEquals(provided.getBytes(StandardCharsets.UTF_8), secretBytes)) {
        var auth = new UsernamePasswordAuthenticationToken(
            "internal-service", null, List.of(new SimpleGrantedAuthority(ROLE)));
        auth.setDetails(request.getHeader("x-internal-service"));
        SecurityContextHolder.getContext().setAuthentication(auth);
      }
    }
    chain.doFilter(request, response);
  }

  private static boolean constantTimeEquals(byte[] a, byte[] b) {
    return MessageDigest.isEqual(a, b);
  }
}
