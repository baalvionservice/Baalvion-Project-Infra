package com.baalvion.risk.controller;

import com.baalvion.risk.dto.RiskAssessmentResponse;
import com.baalvion.risk.service.RiskService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/risk")
public class RiskController {

  private final RiskService riskService;

  public RiskController(RiskService riskService) {
    this.riskService = riskService;
  }

  @GetMapping("/assessments")
  public ResponseEntity<Page<RiskAssessmentResponse>> list(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @RequestParam(required = false) String decision,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    return ResponseEntity.ok(riskService.list(tenantId, decision, page, size));
  }

  @GetMapping("/assessments/{id}")
  public ResponseEntity<RiskAssessmentResponse> get(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @PathVariable UUID id
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    return ResponseEntity.ok(riskService.get(tenantId, id));
  }

  @GetMapping("/transactions/{transactionId}/assessment")
  public ResponseEntity<RiskAssessmentResponse> getByTransaction(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @PathVariable UUID transactionId
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    return ResponseEntity.ok(riskService.getByTransaction(tenantId, transactionId));
  }

  private UUID extractTenantId(String tenantIdHeader) {
    // Authenticated requests derive the tenant from the validated JWT; the header is ignored
    // when authenticated (no IDOR). Used only as a dev fallback when security is disabled.
    return com.baalvion.common.security.TenantContext.resolve(tenantIdHeader);
  }
}
