package com.baalvion.audit.controller;

import com.baalvion.audit.dto.AuditEventResponse;
import com.baalvion.audit.dto.RecordEventRequest;
import com.baalvion.audit.service.AuditService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/audit")
public class AuditController {

  private final AuditService auditService;

  public AuditController(AuditService auditService) {
    this.auditService = auditService;
  }

  @PostMapping("/events")
  public ResponseEntity<AuditEventResponse> record(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @RequestHeader(value = "X-Trace-Id", required = false) String traceId,
    @Valid @RequestBody RecordEventRequest request
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    log.info("POST /audit/events: tenant={}, eventType={}", tenantId, sanitizeForLog(request.getEventType()));

    AuditEventResponse response = auditService.record(tenantId, traceId, request);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @GetMapping("/events/{id}")
  public ResponseEntity<AuditEventResponse> getEvent(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @PathVariable UUID id
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    return ResponseEntity.ok(auditService.getEvent(tenantId, id));
  }

  @GetMapping("/events")
  public ResponseEntity<Page<AuditEventResponse>> listEvents(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @RequestParam(required = false) String eventType,
    @RequestParam(required = false) String aggregateId,
    @RequestParam(required = false) String actor,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    log.info("GET /audit/events: tenant={}, eventType={}, aggregateId={}, actor={}", tenantId, sanitizeForLog(eventType), sanitizeForLog(aggregateId), sanitizeForLog(actor));
    return ResponseEntity.ok(auditService.listEvents(tenantId, eventType, aggregateId, actor, page, size));
  }

  private UUID extractTenantId(String tenantIdHeader) {
    // Authenticated requests derive the tenant from the validated JWT; the header is ignored
    // when authenticated (no IDOR). Used only as a dev fallback when security is disabled.
    return com.baalvion.common.security.TenantContext.resolve(tenantIdHeader);
  }

  // Neutralizes CR/LF/tab in user-derived values before logging to prevent log injection.
  private static String sanitizeForLog(String value) {
    return value == null ? null : value.replaceAll("[\r\n\t]", "_");
  }
}
