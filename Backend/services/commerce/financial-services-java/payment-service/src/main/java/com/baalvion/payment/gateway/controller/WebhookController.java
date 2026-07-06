package com.baalvion.payment.gateway.controller;

import com.baalvion.payment.gateway.service.GatewayService;
import com.baalvion.payment.gateway.spi.WebhookResult;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;

/**
 * Provider webhook sink: {@code POST /v1/gateway/webhooks/{provider}}.
 *
 * <p>Reads the RAW request body (never re-serialized — signatures are computed over the
 * exact bytes) and the inbound headers, then delegates to
 * {@link GatewayService#applyWebhook} which calls the provider adapter's real
 * signature verification before persisting. No JWT: authenticity comes from the
 * provider signature, not platform auth.
 *
 * <p>Consumes any content type ({@code consumes = "*\/*"}) because PayU posts
 * form-encoded fields while Razorpay/Stripe post JSON — verification operates on raw bytes.
 */
@Slf4j
@RestController
public class WebhookController {

  private final GatewayService gatewayService;

  public WebhookController(GatewayService gatewayService) {
    this.gatewayService = gatewayService;
  }

  @PostMapping(
    path = {"/v1/gateway/webhooks/{provider}", "/api/v1/gateway/webhooks/{provider}"},
    consumes = MediaType.ALL_VALUE
  )
  public ResponseEntity<Map<String, Object>> handle(
    @PathVariable String provider,
    @RequestBody(required = false) byte[] rawBody,
    HttpServletRequest httpRequest
  ) {
    // CRITICAL: `site` is read from the QUERY STRING only — never via @RequestParam/getParameter.
    // For an application/x-www-form-urlencoded POST (PayU) the servlet container parses the request
    // BODY into parameters on the first getParameter() call, consuming the input stream and leaving
    // @RequestBody byte[] empty — which silently breaks signature verification (the hash would be
    // computed over zero bytes). Parsing the query string leaves the body intact for every provider.
    String site = queryParam(httpRequest.getQueryString(), "site");
    log.info("POST gateway webhook: site={}, provider={}, bytes={}",
      sanitizeForLog(site), sanitizeForLog(provider), rawBody == null ? 0 : rawBody.length);

    Map<String, String> headers = collectHeaders(httpRequest);
    WebhookResult result = gatewayService.applyWebhook(provider, rawBody == null ? new byte[0] : rawBody, headers, site);

    Map<String, Object> body = new LinkedHashMap<>();
    body.put("received", true);
    body.put("provider", result.provider());
    body.put("eventId", result.providerEventId());
    body.put("status", result.status().name());
    return ResponseEntity.status(HttpStatus.OK).body(body);
  }

  /**
   * Extract a single query-string parameter WITHOUT triggering servlet POST-body parameter parsing
   * (which would consume the raw body needed for signature verification). Decodes percent-escapes.
   */
  private static String queryParam(String queryString, String name) {
    if (queryString == null || queryString.isEmpty()) {
      return null;
    }
    for (String pair : queryString.split("&")) {
      int eq = pair.indexOf('=');
      String key = eq >= 0 ? pair.substring(0, eq) : pair;
      if (name.equals(key)) {
        String value = eq >= 0 ? pair.substring(eq + 1) : "";
        return java.net.URLDecoder.decode(value, java.nio.charset.StandardCharsets.UTF_8);
      }
    }
    return null;
  }

  /** Collect inbound headers into a case-insensitive map for the adapter. */
  private static Map<String, String> collectHeaders(HttpServletRequest request) {
    Map<String, String> headers = new TreeMap<>(String.CASE_INSENSITIVE_ORDER);
    for (String name : Collections.list(request.getHeaderNames())) {
      headers.put(name.toLowerCase(Locale.ROOT), request.getHeader(name));
    }
    return headers;
  }

  /** Strip CR/LF/tab from user-derived values before logging to prevent log injection. */
  private static String sanitizeForLog(String value) {
    return value == null ? null : value.replaceAll("[\r\n\t]", "_");
  }
}
