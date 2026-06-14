package com.baalvion.paymentrails.provider;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Wires the payment rail provider. When no real PSP adapter bean is present, the service falls back
 * to {@link FailClosedRailProvider}, which refuses every instruction (fail closed) rather than
 * minting fake clearing references. Add a real {@link PaymentRailProvider} bean (e.g. gated on
 * {@code app.payment-rails.rail-provider}) to take over for production.
 */
@Configuration
public class RailProviderConfig {

  @Bean
  @ConditionalOnMissingBean(PaymentRailProvider.class)
  public PaymentRailProvider failClosedRailProvider() {
    return new FailClosedRailProvider();
  }
}
