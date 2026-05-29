package com.baalvion.common.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

/**
 * Enforces a second factor (TOTP) on privileged path prefixes (design §7.1).
 *
 * Only acts when the caller is authenticated AND has an enrolled secret (via
 * {@link MfaSecretStore}); then a valid code in the configured header is required. With the
 * default {@link MfaSecretStore.NotEnrolled} store this is inert scaffolding — wiring a real
 * store activates enforcement without code changes.
 */
@Order(Ordered.HIGHEST_PRECEDENCE + 30)
public class MfaVerificationFilter extends OncePerRequestFilter {

  private static final Logger log = LoggerFactory.getLogger(MfaVerificationFilter.class);

  private final SecurityProperties.Mfa config;
  private final MfaSecretStore secretStore;
  private final TotpService totpService;

  public MfaVerificationFilter(SecurityProperties.Mfa config, MfaSecretStore secretStore, TotpService totpService) {
    this.config = config;
    this.secretStore = secretStore;
    this.totpService = totpService;
  }

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    List<String> protectedPaths = config.getProtectedPaths();
    return protectedPaths.isEmpty() || protectedPaths.stream().noneMatch(p -> request.getRequestURI().startsWith(p));
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
    throws ServletException, IOException {
    Optional<String> userId = AuthContext.currentUserId();
    if (userId.isPresent()) {
      Optional<String> secret = secretStore.secretForUser(userId.get());
      if (secret.isPresent()) {
        String code = request.getHeader(config.getHeader());
        if (!totpService.verify(secret.get(), code)) {
          log.warn("MFA challenge failed for user {} on {}", userId.get(), request.getRequestURI());
          response.setStatus(401);
          response.setContentType("application/json");
          response.getWriter().write("{\"code\":\"MFA_REQUIRED\",\"message\":\"Valid " + config.getHeader() + " required\"}");
          return;
        }
      }
    }
    chain.doFilter(request, response);
  }
}
