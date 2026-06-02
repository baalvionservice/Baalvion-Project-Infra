package com.baalvion.tradefinance.provider;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Year;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Default, self-contained {@link IssuingBankAdapter}. It does not call an external network; it
 * deterministically mints a bank reference so the full instrument lifecycle works end-to-end in
 * local/dev and CI. Swap in a real SWIFT adapter by setting
 * {@code app.trade-finance.issuing-bank-provider=swift} and providing that bean.
 *
 * This is an integration seam, not mock business data: it returns no fabricated financial state —
 * only the correspondent-bank reference that a real adapter would obtain from the network.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "app.trade-finance.issuing-bank-provider", havingValue = "simulated", matchIfMissing = true)
public class SimulatedIssuingBankAdapter implements IssuingBankAdapter {

  private final AtomicLong sequence = new AtomicLong(1);

  @Override
  public String registerCredit(UUID tenantId, String lcNumber, BigDecimal amount, String currency, String beneficiaryName) {
    String ref = "MT700-" + Year.now().getValue() + "-" + String.format("%08d", sequence.getAndIncrement());
    log.info("[simulated-issuing-bank] documentary credit {} ({} {}) → ref {}", lcNumber, amount, currency, ref);
    return ref;
  }

  @Override
  public String registerGuarantee(UUID tenantId, String guaranteeNumber, BigDecimal amount, String currency, String beneficiaryName) {
    String ref = "MT760-" + Year.now().getValue() + "-" + String.format("%08d", sequence.getAndIncrement());
    log.info("[simulated-issuing-bank] guarantee {} ({} {}) → ref {}", guaranteeNumber, amount, currency, ref);
    return ref;
  }

  @Override
  public String providerName() {
    return "simulated";
  }
}
