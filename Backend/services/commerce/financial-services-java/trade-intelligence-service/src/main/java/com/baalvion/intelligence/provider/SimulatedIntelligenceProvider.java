package com.baalvion.intelligence.provider;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Self-contained intelligence provider for local/dev: DETERMINISTIC heuristics (seeded by a hash of
 * the inputs, so the same request yields the same result — handy for tests and demos). No external
 * calls and no ML dependency. Swap in a real ml-service adapter for production via
 * {@code app.trade-intelligence.provider=ml-service}.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "app.trade-intelligence.provider", havingValue = "simulated", matchIfMissing = true)
public class SimulatedIntelligenceProvider implements IntelligenceProvider {

  private static final String[] FORECAST_WORDS = {"forecast", "demand", "predict", "trend"};
  private static final String[] RISK_WORDS = {"risk", "default", "reliable", "trust"};

  @Override
  public ForecastResult forecastDemand(UUID tenantId, String commodity, String region, int horizonDays) {
    long seed = seed(commodity + "|" + region);
    // Weekly base demand 500..5500 units, with a mild seasonal sine wave.
    BigDecimal base = BigDecimal.valueOf(500 + (seed % 5000));
    List<ForecastPoint> points = new ArrayList<>();
    BigDecimal total = BigDecimal.ZERO;
    int weeks = Math.max(1, horizonDays / 7);
    LocalDate cursor = LocalDate.now();
    for (int w = 0; w < weeks; w++) {
      double seasonal = 1.0 + 0.15 * Math.sin((2 * Math.PI * w) / 13.0);  // ~quarterly cycle
      double drift = 1.0 + (0.01 * w);                                     // slight growth
      BigDecimal predicted = base.multiply(BigDecimal.valueOf(seasonal * drift)).setScale(4, RoundingMode.HALF_UP);
      BigDecimal band = predicted.multiply(BigDecimal.valueOf(0.12));
      points.add(new ForecastPoint(cursor.plusWeeks(w).toString(), predicted,
        predicted.subtract(band).setScale(4, RoundingMode.HALF_UP), predicted.add(band).setScale(4, RoundingMode.HALF_UP)));
      total = total.add(predicted);
    }
    BigDecimal confidence = BigDecimal.valueOf(0.70 + (seed % 20) / 100.0).setScale(4, RoundingMode.HALF_UP);
    return new ForecastResult(total.setScale(4, RoundingMode.HALF_UP), "units", confidence, points);
  }

  @Override
  public RiskResult assessSupplierRisk(UUID tenantId, UUID supplierId, String supplierName, Map<String, Object> signals) {
    // Risk = weighted blend of negative signals; missing signals default to neutral (50).
    double onTime = num(signals, "onTimeDeliveryPct", 90);     // higher = better
    double disputeRate = num(signals, "disputeRatePct", 3);    // higher = worse
    double financialHealth = num(signals, "financialHealth", 70); // 0-100 higher = better
    double yearsActive = num(signals, "yearsActive", 5);

    double risk = 0.0;
    risk += (100 - onTime) * 0.35;
    risk += disputeRate * 2.0 * 0.25;
    risk += (100 - financialHealth) * 0.30;
    risk += Math.max(0, (3 - yearsActive)) * 5 * 0.10;
    risk = Math.max(0, Math.min(100, risk));
    BigDecimal score = BigDecimal.valueOf(risk).setScale(2, RoundingMode.HALF_UP);

    String grade = risk >= 80 ? "CRITICAL" : risk >= 60 ? "HIGH" : risk >= 35 ? "MEDIUM" : "LOW";
    Map<String, Object> factors = new LinkedHashMap<>();
    factors.put("onTimeDeliveryPct", onTime);
    factors.put("disputeRatePct", disputeRate);
    factors.put("financialHealth", financialHealth);
    factors.put("yearsActive", yearsActive);
    String summary = "Risk " + grade + " (" + score + "/100): "
      + (risk >= 60 ? "elevated default probability — monitor closely / require collateral."
                    : "within acceptable range for standard terms.");
    return new RiskResult(score, grade, factors, summary);
  }

  @Override
  public NlResult interpret(UUID tenantId, String query) {
    String q = query == null ? "" : query.toLowerCase();
    String intent = containsAny(q, RISK_WORDS) ? "SUPPLIER_RISK"
      : containsAny(q, FORECAST_WORDS) ? "DEMAND_FORECAST" : "SEARCH";
    String commodity = guessCommodity(q);
    Map<String, Object> filters = new LinkedHashMap<>();
    if (q.contains("under") || q.contains("below")) filters.put("priceDirection", "below");
    if (q.contains("near") || q.contains("in ")) filters.put("hasLocation", true);
    String answer = switch (intent) {
      case "SUPPLIER_RISK" -> "Interpreted as a supplier-risk query" + (commodity != null ? " for " + commodity : "") + ".";
      case "DEMAND_FORECAST" -> "Interpreted as a demand-forecast query" + (commodity != null ? " for " + commodity : "") + ".";
      default -> "Interpreted as a marketplace search" + (commodity != null ? " for " + commodity : "") + ".";
    };
    return new NlResult(intent, commodity, intent.equals("SEARCH") ? "search" : "analyze", filters, answer);
  }

  @Override
  public BenchmarkResult benchmark(UUID tenantId, String commodity, String region) {
    long seed = seed(commodity + "|" + region);
    BigDecimal median = BigDecimal.valueOf(50 + (seed % 950)).setScale(2, RoundingMode.HALF_UP); // 50..1000 /unit
    BigDecimal p25 = median.multiply(BigDecimal.valueOf(0.88)).setScale(2, RoundingMode.HALF_UP);
    BigDecimal p75 = median.multiply(BigDecimal.valueOf(1.14)).setScale(2, RoundingMode.HALF_UP);
    int sample = 50 + (int) (seed % 450);
    return new BenchmarkResult(median, p25, p75, sample, "USD", "unit");
  }

  @Override
  public String providerName() {
    return "simulated";
  }

  // --- helpers ---
  private static long seed(String s) {
    long h = 1125899906842597L;
    for (int i = 0; i < s.length(); i++) h = 31 * h + s.charAt(i);
    return Math.abs(h);
  }

  private static double num(Map<String, Object> m, String k, double dflt) {
    Object v = m == null ? null : m.get(k);
    if (v instanceof Number n) return n.doubleValue();
    try { return v != null ? Double.parseDouble(v.toString()) : dflt; } catch (Exception e) { return dflt; }
  }

  private static boolean containsAny(String q, String[] words) {
    for (String w : words) if (q.contains(w)) return true;
    return false;
  }

  private static String guessCommodity(String q) {
    for (String c : new String[]{"copper", "steel", "aluminium", "aluminum", "cotton", "wheat", "coffee",
        "cobalt", "lithium", "rice", "sugar", "rubber", "cement", "gold", "silver", "oil", "gas"}) {
      if (q.contains(c)) return c;
    }
    return null;
  }
}
