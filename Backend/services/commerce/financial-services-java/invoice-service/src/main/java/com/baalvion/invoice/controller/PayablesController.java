package com.baalvion.invoice.controller;

import com.baalvion.invoice.domain.Invoice.Direction;
import com.baalvion.invoice.dto.AgingSummaryResponse;
import com.baalvion.invoice.dto.InvoiceResponse;
import com.baalvion.invoice.service.InvoiceService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Accounts Payable views over PAYABLE invoices: aging summary + listing.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/payables")
public class PayablesController {

  private final InvoiceService invoiceService;

  public PayablesController(InvoiceService invoiceService) {
    this.invoiceService = invoiceService;
  }

  @GetMapping("/summary")
  public ResponseEntity<AgingSummaryResponse> summary(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    log.info("GET /payables/summary: tenant={}", tenantId);

    return ResponseEntity.ok(invoiceService.aging(tenantId, Direction.PAYABLE));
  }

  @GetMapping
  public ResponseEntity<Page<InvoiceResponse>> list(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @RequestParam(required = false) String status,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    log.info("GET /payables: tenant={}, status={}, page={}, size={}", tenantId, status, page, size);

    return ResponseEntity.ok(invoiceService.listByDirection(tenantId, Direction.PAYABLE, status, page, size));
  }

  private UUID extractTenantId(String tenantIdHeader) {
    return com.baalvion.common.security.TenantContext.resolve(tenantIdHeader);
  }
}
