package com.baalvion.payment.scheme;

import com.baalvion.payment.domain.Transaction.PaymentScheme;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Fallback scheme adapter used for any scheme without a dedicated, configured integration
 * (e.g. when an ISO 8583 endpoint is not set, or for wallet/internal flows). Produces a
 * deterministic synthetic reference. Real per-scheme adapters take precedence automatically.
 */
@Slf4j
@Component
public class SimulatedSchemeAdapter implements SchemeAdapter {

  @Override
  public boolean supports(PaymentScheme scheme) {
    return true;
  }

  @Override
  public boolean fallback() {
    return true;
  }

  @Override
  public String send(SchemeRequest request) {
    String ref = request.scheme().name() + "-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();
    log.debug("[simulated] routed {} {} {} -> ref={}", request.scheme(), request.amount(), request.currency(), ref);
    return ref;
  }
}
