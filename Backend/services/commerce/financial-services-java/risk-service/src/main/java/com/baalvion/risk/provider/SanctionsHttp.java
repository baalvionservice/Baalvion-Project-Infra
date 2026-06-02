package com.baalvion.risk.provider;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.time.Duration;

/**
 * Shared HTTP fetch for the EU/UN sanctions providers: a {@link RestClient} over the JDK
 * {@link HttpClient} with explicit redirect-following + connect/read timeouts, and a bounded
 * retry-with-backoff helper. (OFAC keeps its own inline copy so its verified code is untouched.)
 */
@Slf4j
public final class SanctionsHttp {

  private SanctionsHttp() {}

  public static RestClient client(int connectTimeoutMs, int readTimeoutMs) {
    HttpClient httpClient = HttpClient.newBuilder()
      .followRedirects(HttpClient.Redirect.NORMAL)
      .connectTimeout(Duration.ofMillis(connectTimeoutMs))
      .build();
    JdkClientHttpRequestFactory rf = new JdkClientHttpRequestFactory(httpClient);
    rf.setReadTimeout(Duration.ofMillis(readTimeoutMs));
    return RestClient.builder().requestFactory(rf).build();
  }

  /** GET {@code url} as a String, retrying up to {@code maxRetries} times with linear backoff. */
  public static String get(RestClient client, String url, int maxRetries, long backoffMs, String label) {
    int max = Math.max(1, maxRetries);
    RuntimeException last = null;
    for (int attempt = 1; attempt <= max; attempt++) {
      try {
        String body = client.get().uri(url).retrieve().body(String.class);
        if (body == null || body.isBlank()) {
          throw new IllegalStateException("empty body from " + url);
        }
        return body;
      } catch (RuntimeException e) {
        last = e;
        log.warn("{} fetch attempt {}/{} failed for {}: {}", label, attempt, max, url, e.getMessage());
        if (attempt < max && backoffMs > 0) {
          try {
            Thread.sleep(backoffMs * attempt);
          } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            break;
          }
        }
      }
    }
    throw new IllegalStateException(label + " feed unavailable after " + max + " attempts: " + url, last);
  }
}
