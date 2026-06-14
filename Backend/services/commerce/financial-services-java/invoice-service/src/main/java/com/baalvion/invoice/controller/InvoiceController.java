package com.baalvion.invoice.controller;

import com.baalvion.invoice.dto.CreateInvoiceRequest;
import com.baalvion.invoice.dto.InvoiceMetricsResponse;
import com.baalvion.invoice.dto.InvoiceResponse;
import com.baalvion.invoice.dto.RecordPaymentRequest;
import com.baalvion.invoice.service.InvoiceService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/invoices")
public class InvoiceController {

  // RBAC for money-moving finance operations is enforced upstream at the auth-gateway / trade BFF
  // (consistent with the other financial-services-java resource services, which do not annotate
  // controller methods). When APP_SECURITY_ENABLED=true the gateway's RS256 identity also flows here.

  private final InvoiceService invoiceService;

  public InvoiceController(InvoiceService invoiceService) {
    this.invoiceService = invoiceService;
  }

  @PostMapping
  public ResponseEntity<InvoiceResponse> createInvoice(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @Valid @RequestBody CreateInvoiceRequest request
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    log.info("POST /invoices: tenant={}, direction={}", tenantId, sanitizeForLog(request.getDirection()));

    InvoiceResponse response = invoiceService.createInvoice(tenantId, request);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @GetMapping
  public ResponseEntity<Page<InvoiceResponse>> listInvoices(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @RequestParam(required = false) String direction,
    @RequestParam(required = false) String status,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    log.info("GET /invoices: tenant={}, direction={}, status={}, page={}, size={}",
      tenantId, sanitizeForLog(direction), sanitizeForLog(status), page, size);

    return ResponseEntity.ok(invoiceService.listInvoices(tenantId, direction, status, page, size));
  }

  @GetMapping("/metrics")
  public ResponseEntity<InvoiceMetricsResponse> metrics(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    log.info("GET /invoices/metrics: tenant={}", tenantId);

    return ResponseEntity.ok(invoiceService.metrics(tenantId));
  }

  @GetMapping("/{id}")
  public ResponseEntity<InvoiceResponse> getInvoice(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @PathVariable UUID id
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    log.info("GET /invoices/{}: tenant={}", id, tenantId);

    return ResponseEntity.ok(invoiceService.getInvoice(tenantId, id));
  }

  @PostMapping("/{id}/issue")
  public ResponseEntity<InvoiceResponse> issue(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @PathVariable UUID id
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    log.info("POST /invoices/{}/issue: tenant={}", id, tenantId);

    return ResponseEntity.ok(invoiceService.issue(tenantId, id, currentActor()));
  }

  @PostMapping("/{id}/payments")
  public ResponseEntity<InvoiceResponse> recordPayment(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @PathVariable UUID id,
    @Valid @RequestBody RecordPaymentRequest request
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    log.info("POST /invoices/{}/payments: tenant={}, amount={}", id, tenantId, request.getAmount());

    return ResponseEntity.ok(invoiceService.recordPayment(tenantId, id, request));
  }

  @PostMapping("/{id}/cancel")
  public ResponseEntity<InvoiceResponse> cancel(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @PathVariable UUID id
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    log.info("POST /invoices/{}/cancel: tenant={}", id, tenantId);

    return ResponseEntity.ok(invoiceService.cancel(tenantId, id, currentActor()));
  }

  @PostMapping("/{id}/dispute")
  public ResponseEntity<InvoiceResponse> dispute(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @PathVariable UUID id
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    log.info("POST /invoices/{}/dispute: tenant={}", id, tenantId);

    return ResponseEntity.ok(invoiceService.dispute(tenantId, id, currentActor()));
  }

  private UUID extractTenantId(String tenantIdHeader) {
    // Authenticated requests derive the tenant from the validated JWT; the header is ignored
    // when authenticated (no IDOR). Used only as a dev fallback when security is disabled.
    return com.baalvion.common.security.TenantContext.resolve(tenantIdHeader);
  }

  /** Best-effort actor identity for the audit log; null when unauthenticated (dev). */
  private String currentActor() {
    var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
    return auth != null ? auth.getName() : null;
  }

  // Neutralizes CR/LF/tab in user-derived values before logging to prevent log injection.
  private static String sanitizeForLog(String value) {
    if (value == null) {
      return null;
    }
    return value.replaceAll("[\r\n\t]", "_");
  }
}
