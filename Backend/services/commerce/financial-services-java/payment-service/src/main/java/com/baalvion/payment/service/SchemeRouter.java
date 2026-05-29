package com.baalvion.payment.service;

import com.baalvion.payment.domain.Transaction.PaymentScheme;
import com.baalvion.payment.scheme.SchemeAdapter;
import com.baalvion.payment.scheme.SchemeRequest;
import io.github.resilience4j.bulkhead.annotation.Bulkhead;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import io.github.resilience4j.timelimiter.annotation.TimeLimiter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

/**
 * Routes a payment to its downstream scheme adapter. This is the external boundary, protected
 * by the full set of resilience patterns from §9.1:
 *   - {@code @CircuitBreaker} — opens on failure-rate threshold (CLOSED/OPEN/HALF_OPEN)
 *   - {@code @Retry}          — transient retries with backoff
 *   - {@code @Bulkhead}       — caps concurrent in-flight scheme calls
 *   - {@code @TimeLimiter}    — bounds latency of the async path ({@link #routeAsync})
 *
 * The concrete protocol lives behind {@link SchemeAdapter}; this router only selects the
 * adapter (dedicated bean per scheme, else the fallback) and applies resilience. On failure it
 * degrades to deferred routing rather than failing the payment.
 */
@Slf4j
@Service
public class SchemeRouter {

  private final Map<PaymentScheme, SchemeAdapter> adapters = new EnumMap<>(PaymentScheme.class);
  private final SchemeAdapter fallback;

  public SchemeRouter(List<SchemeAdapter> schemeAdapters) {
    SchemeAdapter fallbackAdapter = null;
    for (SchemeAdapter adapter : schemeAdapters) {
      if (adapter.fallback()) {
        fallbackAdapter = adapter;
        continue;
      }
      for (PaymentScheme scheme : PaymentScheme.values()) {
        if (adapter.supports(scheme)) {
          adapters.put(scheme, adapter);
        }
      }
    }
    this.fallback = fallbackAdapter;
    log.info("SchemeRouter initialised: {} dedicated adapter(s), fallback={}", adapters.size(),
      fallback != null ? fallback.getClass().getSimpleName() : "none");
  }

  @CircuitBreaker(name = "scheme", fallbackMethod = "routeFallback")
  @Retry(name = "scheme")
  @Bulkhead(name = "scheme")
  public String route(SchemeRequest request) {
    return adapterFor(request.scheme()).send(request);
  }

  /** Time-limited async routing for real external adapters (design §9.1 timeout). */
  @TimeLimiter(name = "scheme")
  @CircuitBreaker(name = "scheme", fallbackMethod = "routeAsyncFallback")
  @Retry(name = "scheme")
  @Bulkhead(name = "scheme")
  public CompletableFuture<String> routeAsync(SchemeRequest request) {
    return CompletableFuture.supplyAsync(() -> adapterFor(request.scheme()).send(request));
  }

  private SchemeAdapter adapterFor(PaymentScheme scheme) {
    SchemeAdapter adapter = adapters.getOrDefault(scheme, fallback);
    if (adapter == null) {
      throw new IllegalStateException("No scheme adapter available for " + scheme);
    }
    return adapter;
  }

  @SuppressWarnings("unused")
  private String routeFallback(SchemeRequest request, Throwable t) {
    log.warn("Scheme routing unavailable for {} ({} {}): {} — deferring",
      request.scheme(), request.amount(), request.currency(), t.getMessage());
    return "ROUTING_DEFERRED";
  }

  @SuppressWarnings("unused")
  private CompletableFuture<String> routeAsyncFallback(SchemeRequest request, Throwable t) {
    log.warn("Async scheme routing unavailable for {} ({} {}): {} — deferring",
      request.scheme(), request.amount(), request.currency(), t.getMessage());
    return CompletableFuture.completedFuture("ROUTING_DEFERRED");
  }
}
