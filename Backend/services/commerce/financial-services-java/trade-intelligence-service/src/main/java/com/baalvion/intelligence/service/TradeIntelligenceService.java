package com.baalvion.intelligence.service;

import com.baalvion.intelligence.config.TradeIntelligenceProperties;
import com.baalvion.intelligence.domain.DemandForecast;
import com.baalvion.intelligence.domain.SupplierRisk;
import com.baalvion.intelligence.domain.SupplierRisk.RiskGrade;
import com.baalvion.intelligence.dto.*;
import com.baalvion.intelligence.exception.NotFoundException;
import com.baalvion.intelligence.provider.IntelligenceProvider;
import com.baalvion.intelligence.repository.DemandForecastRepository;
import com.baalvion.intelligence.repository.SupplierRiskRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Orchestrates the intelligence APIs: validates + scopes the request, delegates inference to the
 * pluggable {@link IntelligenceProvider}, persists forecasts/risk assessments, and shapes the
 * response. NL-assistant and BTI results are computed on demand (not persisted).
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class TradeIntelligenceService {

  private final IntelligenceProvider provider;
  private final DemandForecastRepository forecastRepository;
  private final SupplierRiskRepository riskRepository;
  private final TradeIntelligenceProperties props;
  private final ObjectMapper objectMapper;

  // --------------------------------------------------------------------------- demand forecast

  public ForecastResponse forecast(UUID tenantId, ForecastRequest req) {
    int horizon = (req.getHorizonDays() != null && req.getHorizonDays() > 0)
      ? req.getHorizonDays() : props.getDefaultHorizonDays();
    IntelligenceProvider.ForecastResult result = provider.forecastDemand(tenantId, req.getCommodity(), req.getRegion(), horizon);

    DemandForecast saved = forecastRepository.save(DemandForecast.builder()
      .tenantId(tenantId).commodity(req.getCommodity()).region(req.getRegion()).horizonDays(horizon)
      .predictedTotal(result.predictedTotal()).unit(result.unit()).confidence(result.confidence())
      .points(writeJson(result.points())).provider(provider.providerName())
      .build());

    log.info("Demand forecast: id={}, commodity={}, horizon={}d, total={}, tenant={}",
      saved.getId(), req.getCommodity(), horizon, result.predictedTotal(), tenantId);
    return ForecastResponse.builder()
      .id(saved.getId()).commodity(req.getCommodity()).region(req.getRegion()).horizonDays(horizon)
      .predictedTotal(result.predictedTotal()).unit(result.unit()).confidence(result.confidence())
      .points(result.points()).provider(provider.providerName()).generatedAt(saved.getGeneratedAt())
      .build();
  }

  @Transactional(readOnly = true)
  public ForecastResponse getForecast(UUID tenantId, UUID id) {
    DemandForecast f = forecastRepository.findByIdAndTenantId(id, tenantId)
      .orElseThrow(() -> new NotFoundException("Forecast not found: " + id));
    return ForecastResponse.builder()
      .id(f.getId()).commodity(f.getCommodity()).region(f.getRegion()).horizonDays(f.getHorizonDays())
      .predictedTotal(f.getPredictedTotal()).unit(f.getUnit()).confidence(f.getConfidence())
      .points(readPoints(f.getPoints())).provider(f.getProvider()).generatedAt(f.getGeneratedAt())
      .build();
  }

  // --------------------------------------------------------------------------- supplier risk

  public SupplierRiskResponse assessRisk(UUID tenantId, RiskRequest req) {
    IntelligenceProvider.RiskResult result = provider.assessSupplierRisk(
      tenantId, req.getSupplierId(), req.getSupplierName(), req.getSignals());
    boolean earlyWarning = result.score().compareTo(BigDecimal.valueOf(props.getEarlyWarningThreshold())) >= 0;

    SupplierRisk saved = riskRepository.save(SupplierRisk.builder()
      .tenantId(tenantId).supplierId(req.getSupplierId()).supplierName(req.getSupplierName())
      .score(result.score()).grade(RiskGrade.valueOf(result.grade())).earlyWarning(earlyWarning)
      .factors(writeJson(result.factors())).summary(result.summary()).provider(provider.providerName())
      .build());

    log.info("Supplier risk: id={}, supplier={}, score={}, grade={}, earlyWarning={}, tenant={}",
      saved.getId(), req.getSupplierId(), result.score(), result.grade(), earlyWarning, tenantId);
    return SupplierRiskResponse.from(saved, objectMapper);
  }

  @Transactional(readOnly = true)
  public SupplierRiskResponse latestRisk(UUID tenantId, UUID supplierId) {
    SupplierRisk r = riskRepository.findFirstByTenantIdAndSupplierIdOrderByAssessedAtDesc(tenantId, supplierId)
      .orElseThrow(() -> new NotFoundException("No risk assessment for supplier: " + supplierId));
    return SupplierRiskResponse.from(r, objectMapper);
  }

  // --------------------------------------------------------------------------- NL assistant + BTI

  @Transactional(readOnly = true)
  public NlQueryResponse interpret(UUID tenantId, NlQueryRequest req) {
    IntelligenceProvider.NlResult r = provider.interpret(tenantId, req.getQuery());
    return NlQueryResponse.builder()
      .intent(r.intent()).commodity(r.commodity()).action(r.action()).filters(r.filters())
      .answer(r.answer()).provider(provider.providerName())
      .build();
  }

  @Transactional(readOnly = true)
  public BenchmarkResponse benchmark(UUID tenantId, String commodity, String region) {
    if (commodity == null || commodity.isBlank()) throw new IllegalArgumentException("commodity is required");
    IntelligenceProvider.BenchmarkResult b = provider.benchmark(tenantId, commodity, region);
    return BenchmarkResponse.builder()
      .commodity(commodity).region(region)
      .median(b.median()).p25(b.p25()).p75(b.p75()).sampleSize(b.sampleSize())
      .currency(b.currency()).unit(b.unit()).provider(provider.providerName())
      .build();
  }

  // --------------------------------------------------------------------------- helpers

  private String writeJson(Object value) {
    try { return objectMapper.writeValueAsString(value); }
    catch (Exception e) { throw new IllegalStateException("Unable to serialize JSON field", e); }
  }

  private java.util.List<IntelligenceProvider.ForecastPoint> readPoints(String json) {
    try {
      return objectMapper.readValue(json,
        objectMapper.getTypeFactory().constructCollectionType(java.util.List.class, IntelligenceProvider.ForecastPoint.class));
    } catch (Exception e) { return java.util.List.of(); }
  }
}
