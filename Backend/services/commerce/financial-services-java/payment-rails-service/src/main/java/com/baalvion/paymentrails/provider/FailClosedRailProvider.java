package com.baalvion.paymentrails.provider;

import com.baalvion.paymentrails.domain.PaymentInstruction;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;

/**
 * Default rail provider when no real PSP adapter is configured: refuses every instruction — no
 * synthetic settlement, no fabricated clearing reference. This keeps the service bootable while
 * ensuring it fails closed (the instruction is recorded as FAILED) instead of silently accepting
 * payments that never clear.
 *
 * <p>Registered as a fallback by {@link RailProviderConfig} via {@code @ConditionalOnMissingBean},
 * so a real PSP adapter (SWIFT correspondent, SEPA gateway, UPI/PSP aggregator, …) transparently
 * takes over once one is added to the context.
 */
@Slf4j
public class FailClosedRailProvider implements PaymentRailProvider {

  private static final String REASON = "No payment rail provider configured";

  @Override
  public SubmitResult submit(PaymentInstruction instruction) {
    log.warn("[rail:unconfigured] refusing {} {} via {} — fail closed (no rail provider configured)",
      instruction.getAmount(), instruction.getCurrency(), instruction.getRail());
    return new SubmitResult(false, null, BigDecimal.ZERO, REASON);
  }

  @Override
  public String providerName() {
    return "unconfigured";
  }
}
