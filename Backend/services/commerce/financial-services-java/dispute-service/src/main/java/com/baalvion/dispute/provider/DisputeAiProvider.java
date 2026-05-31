package com.baalvion.dispute.provider;

import com.baalvion.dispute.domain.Dispute;

import java.math.BigDecimal;

/**
 * Port to the AI triage engine (Tier 1). Selected by {@code app.dispute.ai-provider}; the default
 * {@link SimulatedDisputeAiProvider} applies self-contained heuristics for local/dev, and a real
 * adapter calls the Python ml-service / Gemini in production — without touching the domain service.
 */
public interface DisputeAiProvider {

  /** AI triage outcome. recommendation ∈ {AUTO_RESOLVE, RECOMMEND_SPLIT, ESCALATE}. */
  record TriageResult(String recommendation, BigDecimal confidence, String inFavorOf,
                      Integer splitPct, String rationale) {}

  TriageResult triage(Dispute dispute);

  String providerName();
}
