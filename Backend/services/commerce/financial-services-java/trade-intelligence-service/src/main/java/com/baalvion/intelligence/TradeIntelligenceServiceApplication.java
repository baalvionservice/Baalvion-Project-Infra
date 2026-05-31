package com.baalvion.intelligence;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Trade Intelligence Service.
 *
 * The analytics/AI surface for the trade platform:
 *   - Demand forecasting — predict buyer demand per commodity/region over a horizon;
 *   - Supplier risk — a 0-100 default-risk score with an early-warning flag;
 *   - NL trade assistant — turn a plain-language question into a structured trade query;
 *   - BTI — anonymised market benchmarks (the commercial Trade Intelligence data product).
 *
 * This service owns the API contract, validation, tenant scoping and result persistence; the heavy
 * model inference is delegated to a pluggable {@code IntelligenceProvider} — a self-contained
 * heuristic simulator for local/dev, or the Python ml-service / Vertex AI / Gemini in production.
 * It is a read/compute service: no money movement, hence no transactional outbox.
 */
@SpringBootApplication
public class TradeIntelligenceServiceApplication {

  public static void main(String[] args) {
    SpringApplication.run(TradeIntelligenceServiceApplication.class, args);
  }
}
