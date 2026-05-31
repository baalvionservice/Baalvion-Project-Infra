package com.baalvion.paymentrails.provider;

import com.baalvion.paymentrails.domain.PaymentInstruction;
import com.baalvion.paymentrails.domain.PaymentInstruction.Rail;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;
import java.util.UUID;

/**
 * Self-contained rail provider for local/dev: accepts every routed instruction, allocates a
 * scheme-shaped reference, and charges a representative per-rail fee. No external calls. Swap in a
 * real PSP adapter for production via {@code app.payment-rails.rail-provider=psp}.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "app.payment-rails.rail-provider", havingValue = "simulated", matchIfMissing = true)
public class SimulatedRailProvider implements PaymentRailProvider {

  // Representative fee in basis points by rail (wires costlier; domestic-instant near-free).
  private static final Map<Rail, Integer> FEE_BPS = Map.of(
    Rail.SWIFT, 35, Rail.FEDWIRE, 20, Rail.SEPA, 5, Rail.SEPA_INSTANT, 8,
    Rail.ACH, 3, Rail.UPI, 0, Rail.PIX, 0, Rail.MPESA, 50, Rail.SPEI, 2, Rail.PAYNOW, 0);
  private static final BigDecimal BPS = new BigDecimal("10000");

  @Override
  public SubmitResult submit(PaymentInstruction p) {
    int bps = FEE_BPS.getOrDefault(p.getRail(), 10);
    BigDecimal fee = p.getAmount().multiply(BigDecimal.valueOf(bps)).divide(BPS, 4, RoundingMode.HALF_UP);
    String ref = p.getRail().name() + "-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();
    log.info("[rail:simulated] submitted {} {} via {} → ref {} (fee {})",
      p.getAmount(), p.getCurrency(), p.getRail(), ref, fee);
    return new SubmitResult(true, ref, fee, null);
  }

  @Override
  public String providerName() {
    return "simulated";
  }
}
