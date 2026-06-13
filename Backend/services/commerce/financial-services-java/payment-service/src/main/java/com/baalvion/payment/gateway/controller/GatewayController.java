package com.baalvion.payment.gateway.controller;

import com.baalvion.payment.gateway.dto.GatewayPaymentResponse;
import com.baalvion.payment.gateway.dto.InitiateGatewayPaymentRequest;
import com.baalvion.payment.gateway.dto.RefundGatewayPaymentRequest;
import com.baalvion.payment.gateway.service.GatewayService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * PSP gateway-checkout endpoints (Razorpay / Stripe / PayU).
 *
 * <p>Matches the Node gateway contract so consumers re-point by host only:
 * <ul>
 *   <li>POST /v1/gateway/payments — initiate a charge (Idempotency-Key header)</li>
 *   <li>GET  /v1/gateway/payments/{id} — fetch status</li>
 *   <li>POST /v1/gateway/payments/{id}/capture — capture an authorized charge</li>
 *   <li>POST /v1/gateway/payments/{id}/refund — full or partial refund</li>
 * </ul>
 * Webhooks are handled separately by {@link WebhookController}.
 */
@Slf4j
@RestController
@RequestMapping("/v1/gateway/payments")
public class GatewayController {

  private final GatewayService gatewayService;

  public GatewayController(GatewayService gatewayService) {
    this.gatewayService = gatewayService;
  }

  @PostMapping
  public ResponseEntity<GatewayPaymentResponse> initiate(
    @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
    @Valid @RequestBody InitiateGatewayPaymentRequest request
  ) {
    log.info("POST /v1/gateway/payments: provider={}, amount={}, key={}",
      sanitizeForLog(request.getProvider()), request.getAmount(), sanitizeForLog(idempotencyKey));
    GatewayPaymentResponse response = gatewayService.initiate(idempotencyKey, request);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @GetMapping("/{id}")
  public ResponseEntity<GatewayPaymentResponse> get(@PathVariable UUID id) {
    log.info("GET /v1/gateway/payments/{}", id);
    return ResponseEntity.ok(gatewayService.getById(id));
  }

  @PostMapping("/{id}/capture")
  public ResponseEntity<GatewayPaymentResponse> capture(@PathVariable UUID id) {
    log.info("POST /v1/gateway/payments/{}/capture", id);
    return ResponseEntity.ok(gatewayService.capture(id));
  }

  @PostMapping("/{id}/refund")
  public ResponseEntity<GatewayPaymentResponse> refund(
    @PathVariable UUID id,
    @Valid @RequestBody(required = false) RefundGatewayPaymentRequest request
  ) {
    log.info("POST /v1/gateway/payments/{}/refund: partial={}", id, request != null && request.getAmount() != null);
    return ResponseEntity.ok(gatewayService.refund(id, request));
  }

  /** Strip CR/LF/tab from user-derived values before logging to prevent log injection. */
  private static String sanitizeForLog(String value) {
    return value == null ? null : value.replaceAll("[\r\n\t]", "_");
  }
}
