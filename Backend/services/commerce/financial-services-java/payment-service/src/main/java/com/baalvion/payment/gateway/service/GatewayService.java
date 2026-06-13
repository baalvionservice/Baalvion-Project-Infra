package com.baalvion.payment.gateway.service;

import com.baalvion.payment.gateway.domain.GatewayPayment;
import com.baalvion.payment.gateway.dto.GatewayPaymentResponse;
import com.baalvion.payment.gateway.dto.InitiateGatewayPaymentRequest;
import com.baalvion.payment.gateway.dto.RefundGatewayPaymentRequest;
import com.baalvion.payment.gateway.repository.GatewayPaymentRepository;
import com.baalvion.payment.gateway.spi.GatewayChargeRequest;
import com.baalvion.payment.gateway.spi.GatewayChargeResponse;
import com.baalvion.payment.gateway.spi.PaymentGateway;
import com.baalvion.payment.gateway.spi.RefundRequest;
import com.baalvion.payment.gateway.spi.RefundResult;
import com.baalvion.payment.gateway.spi.WebhookResult;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * Orchestrates the PSP gateway-checkout vertical: provider selection, Idempotency-Key
 * enforcement, persistence to {@code payments.gateway_payments}, and webhook application.
 *
 * <p>Talks to providers ONLY through {@link GatewayRegistry} → {@link PaymentGateway};
 * never hardwires a provider. The per-provider HTTP/signature bodies live in the stub
 * adapters (filled in by later agents). Amounts are MINOR units end-to-end.
 */
@Slf4j
@Service
@Transactional
public class GatewayService {

  private final GatewayRegistry registry;
  private final GatewayPaymentRepository repository;
  private final ObjectMapper objectMapper;

  public GatewayService(GatewayRegistry registry, GatewayPaymentRepository repository, ObjectMapper objectMapper) {
    this.registry = registry;
    this.repository = repository;
    this.objectMapper = objectMapper;
  }

  /**
   * Initiate a PSP charge. Enforces the Idempotency-Key: a repeated key returns the
   * existing charge (idempotentReplay=true) instead of creating a second one.
   */
  public GatewayPaymentResponse initiate(String idempotencyKey, InitiateGatewayPaymentRequest request) {
    if (idempotencyKey == null || idempotencyKey.isBlank()) {
      throw new IllegalArgumentException("Idempotency-Key header is required");
    }

    var existing = repository.findByIdempotencyKey(idempotencyKey);
    if (existing.isPresent()) {
      log.info("Idempotent gateway create: key={} already exists, returning charge id={}",
        sanitizeForLog(idempotencyKey), existing.get().getId());
      GatewayPaymentResponse replay = GatewayPaymentResponse.from(existing.get());
      replay.setIdempotentReplay(true);
      return replay;
    }

    String provider = request.getProvider().toLowerCase(Locale.ROOT);
    PaymentGateway gateway = registry.resolve(provider);

    GatewayChargeRequest chargeRequest = new GatewayChargeRequest(
      provider,
      request.getAmount(),
      request.getCurrency(),
      request.getMethod(),
      request.getOrderRef(),
      idempotencyKey,
      request.getCustomer(),
      request.getMetadata()
    );

    GatewayChargeResponse charge = gateway.initiate(chargeRequest);

    GatewayPayment entity = GatewayPayment.builder()
      .provider(provider)
      .providerRef(charge.providerRef())
      .status(charge.status())
      .amount(request.getAmount())
      .currency(request.getCurrency().toUpperCase(Locale.ROOT))
      .method(request.getMethod())
      .orderRef(request.getOrderRef())
      .idempotencyKey(idempotencyKey)
      .customerJson(toJson(request.getCustomer()))
      .rawRequest(toJson(request.getMetadata()))
      .rawResponse(charge.rawResponse())
      .build();

    GatewayPayment saved;
    try {
      saved = repository.save(entity);
    } catch (DataIntegrityViolationException race) {
      // Concurrent create with the same Idempotency-Key won the UNIQUE race; return theirs.
      log.info("Idempotency-Key race on create: key={}, returning the winning charge", sanitizeForLog(idempotencyKey));
      GatewayPayment winner = repository.findByIdempotencyKey(idempotencyKey)
        .orElseThrow(() -> race);
      GatewayPaymentResponse replay = GatewayPaymentResponse.from(winner);
      replay.setIdempotentReplay(true);
      return replay;
    }

    log.info("Gateway payment created: id={}, provider={}, providerRef={}, status={}",
      saved.getId(), provider, saved.getProviderRef(), saved.getStatus());

    GatewayPaymentResponse response = GatewayPaymentResponse.from(saved);
    response.setClientParams(charge.clientParams());
    return response;
  }

  public GatewayPaymentResponse getById(UUID id) {
    GatewayPayment payment = repository.findById(id)
      .orElseThrow(() -> new IllegalArgumentException("Gateway payment not found: " + id));
    return GatewayPaymentResponse.from(payment);
  }

  public GatewayPaymentResponse capture(UUID id) {
    GatewayPayment payment = repository.findById(id)
      .orElseThrow(() -> new IllegalArgumentException("Gateway payment not found: " + id));

    PaymentGateway gateway = registry.resolve(payment.getProvider());
    GatewayChargeResponse charge = gateway.capture(payment.getProviderRef());

    payment.setStatus(charge.status());
    if (charge.rawResponse() != null) {
      payment.setRawResponse(charge.rawResponse());
    }
    GatewayPayment saved = repository.save(payment);
    log.info("Gateway payment captured: id={}, provider={}, status={}", id, payment.getProvider(), saved.getStatus());
    return GatewayPaymentResponse.from(saved);
  }

  public GatewayPaymentResponse refund(UUID id, RefundGatewayPaymentRequest request) {
    GatewayPayment payment = repository.findById(id)
      .orElseThrow(() -> new IllegalArgumentException("Gateway payment not found: " + id));

    PaymentGateway gateway = registry.resolve(payment.getProvider());
    BigDecimal refundAmount = request != null ? request.getAmount() : null;
    String reason = request != null ? request.getReason() : null;

    RefundResult result = gateway.refund(new RefundRequest(payment.getProviderRef(), refundAmount, reason));

    payment.setStatus(result.status());
    if (result.rawResponse() != null) {
      payment.setRawResponse(result.rawResponse());
    }
    GatewayPayment saved = repository.save(payment);
    log.info("Gateway payment refunded: id={}, provider={}, refundId={}, status={}",
      id, payment.getProvider(), result.providerRefundId(), saved.getStatus());
    return GatewayPaymentResponse.from(saved);
  }

  /**
   * Verify (delegated to the provider adapter — real signature check) and apply a webhook,
   * transitioning the matching {@link GatewayPayment} to the event's normalized status.
   *
   * @return the verified result so the controller can ack with the parsed event id
   */
  public WebhookResult applyWebhook(String provider, byte[] rawBody, Map<String, String> headers) {
    PaymentGateway gateway = registry.resolve(provider);
    WebhookResult result = gateway.verifyAndParseWebhook(rawBody, headers);

    repository.findByProviderAndProviderRef(provider.toLowerCase(Locale.ROOT), result.providerRef())
      .ifPresentOrElse(payment -> {
        payment.setStatus(result.status());
        repository.save(payment);
        log.info("Webhook applied: provider={}, eventId={}, providerRef={}, status={}",
          provider, sanitizeForLog(result.providerEventId()), result.providerRef(), result.status());
      }, () -> log.warn("Webhook for unknown charge: provider={}, providerRef={}, eventId={}",
        provider, result.providerRef(), sanitizeForLog(result.providerEventId())));

    return result;
  }

  private String toJson(Map<String, String> map) {
    if (map == null || map.isEmpty()) {
      return "{}";
    }
    try {
      return objectMapper.writeValueAsString(map);
    } catch (JsonProcessingException e) {
      log.warn("Failed to serialize map to JSON; persisting empty object", e);
      return "{}";
    }
  }

  /** Strip CR/LF/tab from user-derived values before logging to prevent log injection. */
  private static String sanitizeForLog(String value) {
    return value == null ? null : value.replaceAll("[\r\n\t]", "_");
  }
}
