package com.baalvion.intelligence.provider;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Port to the inference backend. Selected by {@code app.trade-intelligence.provider}; the default
 * {@link SimulatedIntelligenceProvider} computes self-contained heuristics for local/dev, and a
 * real adapter calls the Python ml-service / Vertex AI / Gemini in production — without touching
 * the API/persistence layer.
 */
public interface IntelligenceProvider {

  record ForecastPoint(String date, BigDecimal predicted, BigDecimal low, BigDecimal high) {}

  record ForecastResult(BigDecimal predictedTotal, String unit, BigDecimal confidence, List<ForecastPoint> points) {}

  record RiskResult(BigDecimal score, String grade, Map<String, Object> factors, String summary) {}

  record NlResult(String intent, String commodity, String action, Map<String, Object> filters, String answer) {}

  record BenchmarkResult(BigDecimal median, BigDecimal p25, BigDecimal p75, int sampleSize, String currency, String unit) {}

  /** Predict demand for a commodity/region over a horizon (days). */
  ForecastResult forecastDemand(UUID tenantId, String commodity, String region, int horizonDays);

  /** Score a supplier's default risk (0-100, higher = riskier) from the supplied signals. */
  RiskResult assessSupplierRisk(UUID tenantId, UUID supplierId, String supplierName, Map<String, Object> signals);

  /** Turn a natural-language trade question into a structured query + short answer. */
  NlResult interpret(UUID tenantId, String query);

  /** Anonymised market benchmark (BTI) for a commodity/region. */
  BenchmarkResult benchmark(UUID tenantId, String commodity, String region);

  String providerName();
}
