package com.baalvion.payment.gateway.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Client for the CMS "Integrations &amp; Keys" vault — faithful replica of the deleted Node SDK
 * call that resolved per-tenant PSP keys:
 *
 * <pre>GET {cmsBaseUrl}/internal/integrations/{slug}  with header  x-internal-secret: {secret}</pre>
 *
 * <p>Response JSON: {@code { "success": true, "data": [ IntegrationConfig... ] }} where each
 * {@code IntegrationConfig} is
 * {@code { provider, category, enabled, status, secrets:{...}, config:{ mode, ... } }}. This client
 * returns the parsed {@code data} array as a {@code List<Map>} for {@code PspConfigResolver} to
 * filter; it does not interpret the entries.
 *
 * <p>Resilience by design: on a blank base URL (GLOBAL/single-tenant mode) or any non-2xx /
 * transport error this returns an EMPTY list and logs a warning — it never throws. The caller
 * decides what an empty result means (the resolver raises {@code PspConfigNotFoundException} if a
 * tenant has no matching provider). The HTTP client mirrors the provider adapters' setup
 * (JDK {@link HttpClient}, 5s connect / 15s read).
 */
@Slf4j
@Component
public class CmsIntegrationsClient {

  private static final int CONNECT_TIMEOUT_MS = 5_000;
  private static final int READ_TIMEOUT_MS = 15_000;
  private static final String INTERNAL_SECRET_HEADER = "x-internal-secret";

  private final CmsProperties properties;
  private final ObjectMapper objectMapper;
  private final RestClient restClient;

  public CmsIntegrationsClient(CmsProperties properties, ObjectMapper objectMapper) {
    this.properties = properties;
    this.objectMapper = objectMapper;
    HttpClient httpClient = HttpClient.newBuilder()
      .followRedirects(HttpClient.Redirect.NORMAL)
      .connectTimeout(Duration.ofMillis(CONNECT_TIMEOUT_MS))
      .build();
    JdkClientHttpRequestFactory rf = new JdkClientHttpRequestFactory(httpClient);
    rf.setReadTimeout(Duration.ofMillis(READ_TIMEOUT_MS));
    this.restClient = RestClient.builder()
      .requestFactory(rf)
      .build();
  }

  /**
   * Fetch the integration configs for {@code slug} from the CMS vault.
   *
   * @param slug the tenant website slug
   * @return the parsed {@code data} array (each entry an IntegrationConfig map); EMPTY on a blank
   *     base URL, a missing slug, a non-2xx response, a transport error, or a malformed body
   */
  public List<Map<String, Object>> fetchIntegrations(String slug) {
    String baseUrl = properties.getBaseUrl();
    if (baseUrl == null || baseUrl.isBlank()) {
      log.debug("CMS base URL not configured; returning no integrations for slug={}", sanitizeForLog(slug));
      return List.of();
    }
    if (slug == null || slug.isBlank()) {
      return List.of();
    }

    String url = stripTrailingSlash(baseUrl) + "/internal/integrations/" + slug;
    try {
      String raw = restClient.get()
        .uri(url)
        .header(INTERNAL_SECRET_HEADER, properties.getInternalSecret())
        .retrieve()
        .body(String.class);
      return parseData(raw, slug);
    } catch (RestClientResponseException e) {
      log.warn("CMS integrations fetch failed for slug={}: HTTP {}", sanitizeForLog(slug), e.getStatusCode().value());
      return List.of();
    } catch (RuntimeException e) {
      log.warn("CMS integrations fetch transport error for slug={}: {}", sanitizeForLog(slug), e.getMessage());
      return List.of();
    }
  }

  /** Parse {@code { success, data:[...] }} into a list of integration maps; EMPTY on any anomaly. */
  private List<Map<String, Object>> parseData(String raw, String slug) {
    if (raw == null || raw.isBlank()) {
      log.warn("CMS integrations response empty for slug={}", sanitizeForLog(slug));
      return List.of();
    }
    try {
      JsonNode root = objectMapper.readTree(raw);
      JsonNode data = root.path("data");
      if (!data.isArray()) {
        log.warn("CMS integrations response had no data array for slug={}", sanitizeForLog(slug));
        return List.of();
      }
      List<Map<String, Object>> result = new ArrayList<>(data.size());
      for (JsonNode entry : data) {
        if (entry.isObject()) {
          result.add(objectMapper.convertValue(entry, new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {}));
        }
      }
      return result;
    } catch (RuntimeException | com.fasterxml.jackson.core.JsonProcessingException e) {
      log.warn("CMS integrations response unparseable for slug={}: {}", sanitizeForLog(slug), e.getMessage());
      return List.of();
    }
  }

  private static String stripTrailingSlash(String value) {
    return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
  }

  /** Strip CR/LF/tab from user-derived values before logging to prevent log injection. */
  private static String sanitizeForLog(String value) {
    return value == null ? null : value.replaceAll("[\r\n\t]", "_").toLowerCase(Locale.ROOT);
  }
}
