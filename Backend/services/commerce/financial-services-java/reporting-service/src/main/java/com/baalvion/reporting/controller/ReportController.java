package com.baalvion.reporting.controller;

import com.baalvion.reporting.dto.CreateReportRequest;
import com.baalvion.reporting.dto.ReportResponse;
import com.baalvion.reporting.service.ReportingService;
import com.baalvion.reporting.service.ReportingService.DownloadPayload;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/reports")
public class ReportController {

  private final ReportingService reportingService;

  public ReportController(ReportingService reportingService) {
    this.reportingService = reportingService;
  }

  @PostMapping
  public ResponseEntity<ReportResponse> createReport(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @Valid @RequestBody CreateReportRequest request
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    log.info("POST /reports: tenant={}, ref={}, format={}, rows={}",
      tenantId, request.getReportRef(), request.getFormat(), request.getRows().size());

    ReportResponse response = reportingService.submit(tenantId, request);
    return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
  }

  @GetMapping("/{id}")
  public ResponseEntity<ReportResponse> getReport(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @PathVariable UUID id
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    return ResponseEntity.ok(reportingService.getReport(tenantId, id));
  }

  @GetMapping
  public ResponseEntity<Page<ReportResponse>> listReports(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @RequestParam(required = false) String status,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    return ResponseEntity.ok(reportingService.listReports(tenantId, status, page, size));
  }

  @GetMapping("/{id}/download")
  public ResponseEntity<byte[]> download(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @PathVariable UUID id
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    DownloadPayload payload = reportingService.download(tenantId, id);
    return ResponseEntity.ok()
      .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + payload.fileName() + "\"")
      .contentType(MediaType.parseMediaType(payload.contentType()))
      .body(payload.content());
  }

  private UUID extractTenantId(String tenantIdHeader) {
    // Authenticated requests derive the tenant from the validated JWT; the header is ignored
    // when authenticated (no IDOR). Used only as a dev fallback when security is disabled.
    return com.baalvion.common.security.TenantContext.resolve(tenantIdHeader);
  }
}
