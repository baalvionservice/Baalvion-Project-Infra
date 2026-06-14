package com.baalvion.payment.gateway.service;

import com.baalvion.payment.gateway.domain.GatewayPayment;
import com.baalvion.payment.gateway.dto.GatewayPaymentResponse;
import com.baalvion.payment.gateway.dto.InitiateGatewayPaymentRequest;
import com.baalvion.payment.gateway.dto.RefundGatewayPaymentRequest;
import com.baalvion.payment.gateway.repository.GatewayPaymentRepository;
import com.baalvion.payment.gateway.spi.GatewayChargeRequest;
import com.baalvion.payment.gateway.spi.GatewayChargeResponse;
import com.baalvion.payment.gateway.spi.PaymentGateway;
import com.baalvion.payment.gateway.spi.ProviderConfig;
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

  /** Tenant scope persisted for single-tenant / env-key (no {@code site}) charges. */
  static final String GLOBAL_SLUG = "__global__";

  private final GatewayRegistry registry;
  private final GatewayPaymentRepository repository;
  private final PspConfigResolver resolver;
  private final ObjectMapper objectMapper;

  public GatewayService(GatewayRegistry registry, GatewayPaymentRepository repository,
                        PspConfigResolver resolver, ObjectMapper objectMapper) {
    this.registry = registry;
    this.repository = repository;
    this.resolver = resolver;
    this.objectMapper = objectMapper;
  }

  /**
   * Initiate a PSP charge for an optional tenant ({@code site}). Enforces the Idempotency-Key
   * PER SITE: a repeated key under the same site returns the existing charge
   * (idempotentReplay=true) instead of creating a second one. When {@code site} is null/blank the
   * behavior is identical to the legacy single-tenant path: global env keys, slug
   * {@code "__global__"}, global idempotency.
   *
   * @param site optional tenant website slug; {@code null} → GLOBAL (env-key) mode
   */
  public GatewayPaymentResponse initiate(String site, String idempotencyKey, InitiateGatewayPaymentRequest request) {
    if (idempotencyKey == null || idempotencyKey.isBlank()) {
      throw new IllegalArgumentException("Idempotency-Key header is required");
    }

    String slug = slugOf(site);

    var existing = repository.findByWebsiteSlugAndIdempotencyKey(slug, idempotencyKey);
    if (existing.isPresent()) {
      log.info("Idempotent gateway create: key={} already exists for site={}, returning charge id={}",
        sanitizeForLog(idempotencyKey), sanitizeForLog(slug), existing.get().getId());
      GatewayPaymentResponse replay = GatewayPaymentResponse.from(existing.get());
      replay.setIdempotentReplay(true);
      return replay;
    }

    String provider = request.getProvider().toLowerCase(Locale.ROOT);
    PaymentGateway gateway = registry.resolve(provider);
    ProviderConfig cfg = resolver.resolve(site, provider);

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

    GatewayChargeResponse charge = gateway.initiate(chargeRequest, cfg);

    GatewayPayment entity = GatewayPayment.builder()
      .websiteSlug(slug)
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
      // Concurrent create with the same (site, Idempotency-Key) won the UNIQUE race; return theirs.
      log.info("Idempotency-Key race on create: key={}, site={}, returning the winning charge",
        sanitizeForLog(idempotencyKey), sanitizeForLog(slug));
      GatewayPayment winner = repository.findByWebsiteSlugAndIdempotencyKey(slug, idempotencyKey)
        .orElseThrow(() -> race);
      GatewayPaymentResponse replay = GatewayPaymentResponse.from(winner);
      replay.setIdempotentReplay(true);
      return replay;
    }

    log.info("Gateway payment created: id={}, site={}, provider={}, providerRef={}, status={}",
      saved.getId(), sanitizeForLog(slug), provider, saved.getProviderRef(), saved.getStatus());

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
    ProviderConfig cfg = resolver.resolve(siteOf(payment), payment.getProvider());
    GatewayChargeResponse charge = gateway.capture(payment.getProviderRef(), cfg);

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
    ProviderConfig cfg = resolver.resolve(siteOf(payment), payment.getProvider());
    BigDecimal refundAmount = request != null ? request.getAmount() : null;
    String reason = request != null ? request.getReason() : null;

    RefundResult result = gateway.refund(new RefundRequest(payment.getProviderRef(), refundAmount, reason), cfg);

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
   * transitioning the matching {@link GatewayPayment} to the event's normalized status. The
   * provider config (carrying the webhook secret) is resolved for the optional {@code site};
   * the matching charge is looked up scoped to that same tenant.
   *
   * @param site optional tenant website slug; {@code null} → GLOBAL (env-key) mode
   * @return the verified result so the controller can ack with the parsed event id
   */
  public WebhookResult applyWebhook(String provider, byte[] rawBody, Map<String, String> headers, String site) {
    String slug = slugOf(site);
    PaymentGateway gateway = registry.resolve(provider);
    ProviderConfig cfg = resolver.resolve(site, provider);
    WebhookResult result = gateway.verifyAndParseWebhook(rawBody, headers, cfg);

    repository.findByWebsiteSlugAndProviderAndProviderRef(slug, provider.toLowerCase(Locale.ROOT), result.providerRef())
      .ifPresentOrElse(payment -> {
        payment.setStatus(result.status());
        repository.save(payment);
        log.info("Webhook applied: site={}, provider={}, eventId={}, providerRef={}, status={}",
          sanitizeForLog(slug), provider, sanitizeForLog(result.providerEventId()), result.providerRef(), result.status());
      }, () -> log.warn("Webhook for unknown charge: site={}, provider={}, providerRef={}, eventId={}",
        sanitizeForLog(slug), provider, result.providerRef(), sanitizeForLog(result.providerEventId())));

    return result;
  }

  /** Normalize an optional site to the persisted slug ({@code "__global__"} when absent). */
  private static String slugOf(String site) {
    return (site == null || site.isBlank()) ? GLOBAL_SLUG : site;
  }

  /** Derive the resolver's site (null for global) from a persisted entity's slug. */
  private static String siteOf(GatewayPayment payment) {
    String slug = payment.getWebsiteSlug();
    return (slug == null || GLOBAL_SLUG.equals(slug)) ? null : slug;
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
