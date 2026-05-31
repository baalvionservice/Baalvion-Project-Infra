package com.baalvion.intelligence.controller;

import com.baalvion.common.security.TenantContext;
import com.baalvion.intelligence.dto.*;
import com.baalvion.intelligence.service.TradeIntelligenceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/** REST API for trade intelligence (forecasts, supplier risk, NL assistant, BTI). Tenant-scoped. */
@Slf4j
@RestController
@RequestMapping("/api/v1/intelligence")
@RequiredArgsConstructor
public class IntelligenceController {

  private final TradeIntelligenceService service;

  // --- demand forecasting ---
  @PostMapping("/forecasts")
  public ResponseEntity<ForecastResponse> forecast(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant,
    @Valid @RequestBody ForecastRequest request
  ) {
    return ResponseEntity.status(HttpStatus.CREATED).body(service.forecast(TenantContext.resolve(tenant), request));
  }

  @GetMapping("/forecasts/{id}")
  public ResponseEntity<ForecastResponse> getForecast(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant,
    @PathVariable UUID id
  ) {
    return ResponseEntity.ok(service.getForecast(TenantContext.resolve(tenant), id));
  }

  // --- supplier risk ---
  @PostMapping("/supplier-risk")
  public ResponseEntity<SupplierRiskResponse> assessRisk(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant,
    @Valid @RequestBody RiskRequest request
  ) {
    return ResponseEntity.status(HttpStatus.CREATED).body(service.assessRisk(TenantContext.resolve(tenant), request));
  }

  @GetMapping("/supplier-risk/{supplierId}/latest")
  public ResponseEntity<SupplierRiskResponse> latestRisk(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant,
    @PathVariable UUID supplierId
  ) {
    return ResponseEntity.ok(service.latestRisk(TenantContext.resolve(tenant), supplierId));
  }

  // --- NL trade assistant ---
  @PostMapping("/assistant")
  public ResponseEntity<NlQueryResponse> interpret(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant,
    @Valid @RequestBody NlQueryRequest request
  ) {
    return ResponseEntity.ok(service.interpret(TenantContext.resolve(tenant), request));
  }

  // --- Baalvion Trade Intelligence (BTI) benchmarks ---
  @GetMapping("/benchmark")
  public ResponseEntity<BenchmarkResponse> benchmark(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant,
    @RequestParam String commodity,
    @RequestParam(required = false) String region
  ) {
    return ResponseEntity.ok(service.benchmark(TenantContext.resolve(tenant), commodity, region));
  }
}
