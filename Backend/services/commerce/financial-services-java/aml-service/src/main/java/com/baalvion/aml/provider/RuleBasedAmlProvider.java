package com.baalvion.aml.provider;

import com.baalvion.aml.config.AmlProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

/**
 * Built-in AML typology rules engine (default provider). Each rule that fires adds points; the
 * capped total maps to a FATF-aligned grade. Transparent and self-contained for local/dev; swap in
 * a vendor adapter via {@code app.aml.provider=vendor}.
 *
 * Rules: high-value (>= reporting threshold), structuring (just below threshold), round-amount,
 * payments to/from FATF high-risk (call-for-action) or grey-list (increased-monitoring)
 * jurisdictions, and velocity (burst of recent transactions).
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.aml.provider", havingValue = "simulated", matchIfMissing = true)
public class RuleBasedAmlProvider implements AmlScreeningProvider {

  private final AmlProperties props;

  @Override
  public ScreenOutcome screen(ScreenInput in) {
    List<RuleHit> hits = new ArrayList<>();
    BigDecimal amount = in.amount() != null ? in.amount() : BigDecimal.ZERO;
    String country = in.counterpartyCountry() != null ? in.counterpartyCountry().toUpperCase() : null;
    BigDecimal threshold = props.getReportingThreshold();

    if (amount.compareTo(threshold) >= 0) {
      hits.add(new RuleHit("HIGH_VALUE", "Transaction at or above the reporting threshold", 30));
    } else {
      BigDecimal floor = threshold.multiply(BigDecimal.ONE.subtract(props.getStructuringBand()));
      if (amount.compareTo(floor) >= 0) {
        hits.add(new RuleHit("STRUCTURING", "Amount just below the reporting threshold (possible smurfing)", 35));
      }
    }
    BigDecimal unit = props.getRoundAmountUnit();
    if (unit.signum() > 0 && amount.compareTo(unit) >= 0
        && amount.remainder(unit).compareTo(BigDecimal.ZERO) == 0) {
      hits.add(new RuleHit("ROUND_AMOUNT", "Large exact round amount", 15));
    }
    if (country != null && props.getHighRiskCountries().contains(country)) {
      hits.add(new RuleHit("FATF_HIGH_RISK", "Counterparty in a FATF call-for-action jurisdiction", 50));
    } else if (country != null && props.getGreyListCountries().contains(country)) {
      hits.add(new RuleHit("FATF_GREY_LIST", "Counterparty in a FATF increased-monitoring jurisdiction", 20));
    }
    if (in.recentTxCount() != null && in.recentTxCount() >= 10) {
      hits.add(new RuleHit("VELOCITY", "High transaction velocity in the last 24h", 25));
    }

    int total = Math.min(100, hits.stream().mapToInt(RuleHit::points).sum());
    BigDecimal score = BigDecimal.valueOf(total).setScale(2, RoundingMode.UNNECESSARY);
    String grade = total >= 80 ? "CRITICAL" : total >= 60 ? "HIGH" : total >= 35 ? "MEDIUM" : "LOW";
    return new ScreenOutcome(score, grade, hits);
  }

  @Override
  public String providerName() {
    return "simulated";
  }
}
