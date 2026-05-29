package com.baalvion.common.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.security.web.util.matcher.IpAddressMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * IP allowlisting for sensitive path prefixes (design §7.2 — admin endpoints).
 *
 * When a request targets one of the configured protected paths AND an allowlist is set, the
 * caller IP must match one of the CIDRs/addresses (uses Spring Security's
 * {@link IpAddressMatcher}, IPv4 + IPv6). An empty allowlist disables the check.
 */
@Order(Ordered.HIGHEST_PRECEDENCE + 20)
public class IpAllowlistFilter extends OncePerRequestFilter {

  private static final Logger log = LoggerFactory.getLogger(IpAllowlistFilter.class);

  private final List<String> protectedPaths;
  private final List<IpAddressMatcher> matchers;

  public IpAllowlistFilter(SecurityProperties.Ip config) {
    this.protectedPaths = config.getProtectedPaths();
    this.matchers = config.getAllowlist().stream().map(IpAddressMatcher::new).toList();
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
    throws ServletException, IOException {
    if (!matchers.isEmpty() && isProtected(request.getRequestURI()) && !isAllowed(clientIp(request))) {
      log.warn("IP {} blocked from protected path {}", clientIp(request), request.getRequestURI());
      response.setStatus(403);
      response.setContentType("application/json");
      response.getWriter().write("{\"code\":\"IP_NOT_ALLOWED\",\"message\":\"Source IP is not permitted for this endpoint\"}");
      return;
    }
    chain.doFilter(request, response);
  }

  private boolean isProtected(String path) {
    return protectedPaths.stream().anyMatch(path::startsWith);
  }

  private boolean isAllowed(String ip) {
    return matchers.stream().anyMatch(m -> m.matches(ip));
  }

  private String clientIp(HttpServletRequest request) {
    String forwarded = request.getHeader("X-Forwarded-For");
    if (forwarded != null && !forwarded.isBlank()) {
      return forwarded.split(",")[0].trim();
    }
    return request.getRemoteAddr();
  }
}
