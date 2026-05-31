package com.baalvion.trustscore.controller;

import com.baalvion.common.security.TenantContext;
import com.baalvion.trustscore.dto.ComputeRequest;
import com.baalvion.trustscore.dto.HistoryResponse;
import com.baalvion.trustscore.dto.ScoreResponse;
import com.baalvion.trustscore.service.TrustScoreService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/** REST API for composite counterparty trust scoring. All routes are tenant-scoped via the JWT. */
@Slf4j
@RestController
@RequestMapping("/api/v1/trust-scores")
@RequiredArgsConstructor
public class TrustScoreController {

  private final TrustScoreService service;

  /** (Re)compute a subject's trust score from the supplied signals. Idempotent per signal set. */
  @PostMapping("/compute")
  public ResponseEntity<ScoreResponse> compute(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant,
    @Valid @RequestBody ComputeRequest request
  ) {
    return ResponseEntity.ok(service.compute(TenantContext.resolve(tenant), request));
  }

  /** Current score for a subject. */
  @GetMapping("/{subjectType}/{subjectId}")
  public ResponseEntity<ScoreResponse> get(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant,
    @PathVariable String subjectType, @PathVariable UUID subjectId
  ) {
    return ResponseEntity.ok(service.get(TenantContext.resolve(tenant), subjectId, subjectType));
  }

  /** Append-only score history for a subject (most recent first). */
  @GetMapping("/{subjectType}/{subjectId}/history")
  public ResponseEntity<Page<HistoryResponse>> history(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant,
    @PathVariable String subjectType, @PathVariable UUID subjectId,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size
  ) {
    return ResponseEntity.ok(service.history(TenantContext.resolve(tenant), subjectId, subjectType, page, size));
  }

  /** List current scores for the tenant, optionally filtered by band, highest first. */
  @GetMapping
  public ResponseEntity<Page<ScoreResponse>> list(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant,
    @RequestParam(required = false) String band,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size
  ) {
    return ResponseEntity.ok(service.list(TenantContext.resolve(tenant), band, page, size));
  }
}
