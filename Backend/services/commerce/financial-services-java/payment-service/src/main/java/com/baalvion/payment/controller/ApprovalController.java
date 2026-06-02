package com.baalvion.payment.controller;

import com.baalvion.common.security.AuthContext;
import com.baalvion.payment.dto.ApprovalResponse;
import com.baalvion.payment.service.ApprovalService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Maker-checker console for payment approvals (design §7.1). The checker identity is the
 * authenticated subject; {@code X-Actor} is a dev fallback when security is disabled.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/payments/approvals")
public class ApprovalController {

  private final ApprovalService approvalService;

  public ApprovalController(ApprovalService approvalService) {
    this.approvalService = approvalService;
  }

  @GetMapping
  public ResponseEntity<Page<ApprovalResponse>> list(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @RequestParam(required = false) String status,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size
  ) {
    UUID tenantId = com.baalvion.common.security.TenantContext.resolve(tenantIdHeader);
    return ResponseEntity.ok(approvalService.list(tenantId, status, page, size));
  }

  @GetMapping("/{id}")
  public ResponseEntity<ApprovalResponse> get(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @PathVariable UUID id
  ) {
    UUID tenantId = com.baalvion.common.security.TenantContext.resolve(tenantIdHeader);
    return ResponseEntity.ok(approvalService.get(tenantId, id));
  }

  @PostMapping("/{id}/approve")
  public ResponseEntity<ApprovalResponse> approve(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @RequestHeader(value = "X-Actor", required = false) String actorHeader,
    @PathVariable UUID id
  ) {
    UUID tenantId = com.baalvion.common.security.TenantContext.resolve(tenantIdHeader);
    String checker = actor(actorHeader);
    log.info("POST /payments/approvals/{}/approve by {}", id, sanitizeForLog(checker));
    return ResponseEntity.ok(approvalService.approve(tenantId, id, checker));
  }

  @PostMapping("/{id}/reject")
  public ResponseEntity<ApprovalResponse> reject(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @RequestHeader(value = "X-Actor", required = false) String actorHeader,
    @PathVariable UUID id,
    @RequestParam(required = false) String reason
  ) {
    UUID tenantId = com.baalvion.common.security.TenantContext.resolve(tenantIdHeader);
    String checker = actor(actorHeader);
    log.info("POST /payments/approvals/{}/reject by {}", id, sanitizeForLog(checker));
    return ResponseEntity.ok(approvalService.reject(tenantId, id, checker, reason));
  }

  private String actor(String actorHeader) {
    return AuthContext.currentUserId().orElse(actorHeader != null && !actorHeader.isBlank() ? actorHeader : "anonymous");
  }

  /** Strips CR/LF/tab from user-derived values before logging to prevent log injection. */
  private static String sanitizeForLog(String value) {
    return value == null ? null : value.replaceAll("[\r\n\t]", "_");
  }
}
