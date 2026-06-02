package com.baalvion.dispute.provider;

import com.baalvion.dispute.domain.Dispute;
import com.baalvion.dispute.domain.Dispute.DisputeType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Self-contained Tier-1 triage for local/dev: a transparent heuristic over dispute type, amount and
 * evidence strength. NON_DELIVERY/PAYMENT with evidence lean to the claimant; QUALITY/QUANTITY lean
 * to a split; thin or high-value disputes escalate to a human mediator. No external calls. Swap in
 * an ml-service adapter via {@code app.dispute.ai-provider=ml-service}.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "app.dispute.ai-provider", havingValue = "simulated", matchIfMissing = true)
public class SimulatedDisputeAiProvider implements DisputeAiProvider {

  private static final BigDecimal HIGH_VALUE = new BigDecimal("50000");

  @Override
  public TriageResult triage(Dispute d) {
    int evidenceStrength = evidenceCount(d.getEvidence());
    boolean highValue = d.getAmount() != null && d.getAmount().compareTo(HIGH_VALUE) >= 0;

    // High-value or evidence-poor cases are too risky to auto-decide — escalate to mediation.
    if (highValue || evidenceStrength == 0) {
      return new TriageResult("ESCALATE", conf(0.55),
        null, null, "High value or insufficient evidence — recommend human mediation.");
    }

    DisputeType t = d.getType();
    if (t == DisputeType.NON_DELIVERY || t == DisputeType.PAYMENT) {
      // Clear-cut categories with evidence favour the claimant.
      return new TriageResult("AUTO_RESOLVE", conf(0.80),
        d.getRaisedBy().name(), null,
        "Documented " + t + " dispute — recommend resolving in favour of the claimant.");
    }
    if (t == DisputeType.QUALITY || t == DisputeType.QUANTITY) {
      return new TriageResult("RECOMMEND_SPLIT", conf(0.65),
        "SPLIT", 50, t + " dispute — recommend a 50/50 settlement pending inspection evidence.");
    }
    return new TriageResult("ESCALATE", conf(0.50), null, null,
      "Ambiguous dispute — recommend human mediation.");
  }

  @Override
  public String providerName() {
    return "simulated";
  }

  private static int evidenceCount(String evidenceJson) {
    if (evidenceJson == null) return 0;
    String s = evidenceJson.trim();
    if (s.equals("[]") || s.isEmpty()) return 0;
    // Cheap element count without full JSON parsing: count commas + 1 for a non-empty array.
    return s.replaceAll("[^,]", "").length() + 1;
  }

  private static BigDecimal conf(double v) {
    return BigDecimal.valueOf(v);
  }
}
