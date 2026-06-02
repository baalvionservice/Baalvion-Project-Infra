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

/**
 * Per-client rate limiting (design §7.2 / §9.1). The client key is the authenticated subject
 * when present, otherwise the remote IP. Counting is delegated to a {@link RateLimiterBackend}
 * (in-memory Bucket4j by default, or Redis for a cluster-wide limit), so the limit policy is
 * identical regardless of topology.
 */
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class RateLimitFilter extends OncePerRequestFilter {

  private static final Logger log = LoggerFactory.getLogger(RateLimitFilter.class);

  private final SecurityProperties.RateLimit config;
  private final RateLimiterBackend backend;

  public RateLimitFilter(SecurityProperties.RateLimit config, RateLimiterBackend backend) {
    this.config = config;
    this.backend = backend;
  }

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    String path = request.getRequestURI();
    return config.getExcludePaths().stream().anyMatch(path::startsWith);
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
    throws ServletException, IOException {
    String key = clientKey(request);
    if (backend.tryAcquire(key)) {
      chain.doFilter(request, response);
    } else {
      log.warn(
        "Rate limit exceeded for {} on {}",
        sanitizeForLog(key),
        sanitizeForLog(request.getRequestURI()));
      response.setStatus(429);
      response.setHeader("Retry-After", String.valueOf(config.getRefillPeriodSeconds()));
      response.setContentType("application/json");
      response.getWriter().write("{\"code\":\"RATE_LIMITED\",\"message\":\"Too many requests\"}");
    }
  }

  private String clientKey(HttpServletRequest request) {
    return AuthContext.currentUserId().orElseGet(() -> "ip:" + clientIp(request));
  }

  /** Strip CR/LF/tab from user-derived values to prevent log-injection (CRLF) attacks. */
  private static String sanitizeForLog(String value) {
    if (value == null) {
      return null;
    }
    return value.replaceAll("[\r\n\t]", "_");
  }

  private String clientIp(HttpServletRequest request) {
    String forwarded = request.getHeader("X-Forwarded-For");
    if (forwarded != null && !forwarded.isBlank()) {
      return forwarded.split(",")[0].trim();
    }
    return request.getRemoteAddr();
  }
}
