package com.baalvion.risk.controller;

import com.baalvion.common.security.AuthContext;
import com.baalvion.common.security.TenantContext;
import com.baalvion.risk.dto.AdjudicateRequest;
import com.baalvion.risk.dto.ScreenRequest;
import com.baalvion.risk.dto.ScreenResult;
import com.baalvion.risk.dto.ScreeningResponse;
import com.baalvion.risk.service.SanctionsService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * Sanctions screening API (gap G3). Screening is tenant-scoped; the watchlist (entities) is global.
 * Tenant is derived from the validated JWT when security is enabled; the {@code X-Tenant-ID} header
 * is a dev fallback only.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/sanctions")
public class SanctionsController {

  private final SanctionsService sanctionsService;

  public SanctionsController(SanctionsService sanctionsService) {
    this.sanctionsService = sanctionsService;
  }

  /**
   * Screen a subject against the consolidated watchlist (live provider data once
   * {@code app.sanctions.provider=ofac}). Strict contract:
   * <pre>in  { name, country? }
   * out { status, confidence, matches: [{ name, source, program? }] }</pre>
   * Every call persists a tenant-scoped {@code sanctions_screenings} audit row and emits
   * {@code sanctions.screening.completed} (the per-request audit log entry).
   */
  @PostMapping("/screen")
  public ResponseEntity<ScreenResult> screen(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @Valid @RequestBody ScreenRequest request
  ) {
    UUID tenantId = TenantContext.resolve(tenantIdHeader);
    ScreeningResponse internal = sanctionsService.screen(tenantId, request);
    return ResponseEntity.ok(ScreenResult.from(internal));
  }

  @GetMapping("/screenings")
  public ResponseEntity<Page<ScreeningResponse>> list(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @RequestParam(required = false) String status,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size
  ) {
    UUID tenantId = TenantContext.resolve(tenantIdHeader);
    return ResponseEntity.ok(sanctionsService.list(tenantId, status, page, size));
  }

  @GetMapping("/screenings/{id}")
  public ResponseEntity<ScreeningResponse> get(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @PathVariable UUID id
  ) {
    UUID tenantId = TenantContext.resolve(tenantIdHeader);
    return ResponseEntity.ok(sanctionsService.get(tenantId, id));
  }

  /** Compliance-officer decision on a potential/confirmed match (confirm → BLOCKED, else FALSE_POSITIVE). */
  @PostMapping("/screenings/{id}/adjudicate")
  public ResponseEntity<ScreeningResponse> adjudicate(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @PathVariable UUID id,
    @Valid @RequestBody AdjudicateRequest request
  ) {
    requireSanctionsManager();
    UUID tenantId = TenantContext.resolve(tenantIdHeader);
    String officerId = AuthContext.currentUserId().orElse(null);
    return ResponseEntity.ok(sanctionsService.adjudicate(tenantId, id, officerId, request));
  }

  /** Refresh the watchlist from the active provider (admin/ops). Returns the number of entities upserted. */
  @PostMapping("/lists/refresh")
  public ResponseEntity<Map<String, Object>> refresh() {
    requireSanctionsManager();
    int count = sanctionsService.ingest();
    return ResponseEntity.status(HttpStatus.OK).body(Map.of(
      "upserted", count,
      "activeEntities", sanctionsService.entityCount()
    ));
  }

  /**
   * Privileged-operation guard for adjudication and watchlist refresh. When security is enabled the
   * caller must hold a compliance/admin role (checked as both a {@code ROLE_}-prefixed role and a raw
   * authority, plus the fine-grained {@code sanctions:manage} permission). When security is disabled
   * (gateway-trusted local/dev) requests are unauthenticated and permitted, matching the suite posture.
   */
  private void requireSanctionsManager() {
    if (!AuthContext.isAuthenticated()) {
      return;
    }
    boolean allowed =
         AuthContext.hasRole("super_admin")        || AuthContext.hasAuthority("super_admin")
      || AuthContext.hasRole("organization_admin") || AuthContext.hasAuthority("organization_admin")
      || AuthContext.hasRole("compliance_officer") || AuthContext.hasAuthority("compliance_officer")
      || AuthContext.hasAuthority("sanctions:manage");
    if (!allowed) {
      throw new AccessDeniedException("Sanctions management (adjudicate / list refresh) requires a compliance or admin role");
    }
  }
}
