package com.baalvion.audit.controller;

import com.baalvion.audit.dto.CreateWebhookRequest;
import com.baalvion.audit.dto.WebhookDeliveryResponse;
import com.baalvion.audit.dto.WebhookSubscriptionResponse;
import com.baalvion.audit.webhook.WebhookService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Webhook subscription management (design §7.2). Subscribers register a URL + secret and
 * receive HMAC-SHA256-signed callbacks for matching events.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/audit/webhooks")
public class WebhookController {

  private final WebhookService webhookService;

  public WebhookController(WebhookService webhookService) {
    this.webhookService = webhookService;
  }

  @PostMapping
  public ResponseEntity<WebhookSubscriptionResponse> register(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @Valid @RequestBody CreateWebhookRequest request
  ) {
    UUID tenantId = com.baalvion.common.security.TenantContext.resolve(tenantIdHeader);
    log.info("POST /audit/webhooks: tenant={}, url={}", tenantId, request.getUrl());
    WebhookSubscriptionResponse response = webhookService.register(tenantId, request.getUrl(), request.getSecret(), request.getEventPattern());
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @GetMapping
  public ResponseEntity<Page<WebhookSubscriptionResponse>> list(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size
  ) {
    UUID tenantId = com.baalvion.common.security.TenantContext.resolve(tenantIdHeader);
    return ResponseEntity.ok(webhookService.list(tenantId, page, size));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<WebhookSubscriptionResponse> deactivate(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @PathVariable UUID id
  ) {
    UUID tenantId = com.baalvion.common.security.TenantContext.resolve(tenantIdHeader);
    return ResponseEntity.ok(webhookService.deactivate(tenantId, id));
  }

  @GetMapping("/{id}/deliveries")
  public ResponseEntity<Page<WebhookDeliveryResponse>> deliveries(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @PathVariable UUID id,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size
  ) {
    UUID tenantId = com.baalvion.common.security.TenantContext.resolve(tenantIdHeader);
    return ResponseEntity.ok(webhookService.deliveries(tenantId, id, page, size));
  }
}
