package com.baalvion.payment.gateway.service;

import com.baalvion.payment.gateway.spi.PaymentGateway;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Resolves a {@link PaymentGateway} by its provider key.
 *
 * <p>Spring injects every {@link PaymentGateway} {@code @Component} on the classpath;
 * this registry indexes them by {@link PaymentGateway#name()} (lower-cased) so
 * {@code GatewayService} can pick one from the request's {@code provider} field —
 * the open/closed seam that lets new providers register without touching the service.
 */
@Slf4j
@Component
public class GatewayRegistry {

  private final Map<String, PaymentGateway> gatewaysByName;

  public GatewayRegistry(List<PaymentGateway> gateways) {
    this.gatewaysByName = gateways.stream()
      .collect(Collectors.toUnmodifiableMap(
        g -> g.name().toLowerCase(Locale.ROOT),
        Function.identity()
      ));
    log.info("Registered {} PSP gateways: {}", gatewaysByName.size(), gatewaysByName.keySet());
  }

  /**
   * @param provider provider key, case-insensitive ({@code razorpay|stripe|payu})
   * @return the matching gateway
   * @throws IllegalArgumentException if no gateway is registered for the provider (HTTP 400)
   */
  public PaymentGateway resolve(String provider) {
    if (provider == null || provider.isBlank()) {
      throw new IllegalArgumentException("Provider is required");
    }
    PaymentGateway gateway = gatewaysByName.get(provider.toLowerCase(Locale.ROOT));
    if (gateway == null) {
      throw new IllegalArgumentException("Unsupported payment provider: " + provider);
    }
    return gateway;
  }
}
