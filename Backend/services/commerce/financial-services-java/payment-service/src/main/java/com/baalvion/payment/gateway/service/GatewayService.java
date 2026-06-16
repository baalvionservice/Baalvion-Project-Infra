package com.baalvion.payment.gateway.service;

import com.baalvion.payment.gateway.domain.GatewayPayment;
import com.baalvion.payment.gateway.domain.GatewayWebhookEvent;
import com.baalvion.payment.gateway.dto.GatewayPaymentResponse;
import com.baalvion.payment.gateway.dto.InitiateGatewayPaymentRequest;
import com.baalvion.payment.gateway.dto.RefundGatewayPaymentRequest;
import com.baalvion.payment.gateway.exception.WebhookAmountMismatchException;
import com.baalvion.payment.gateway.repository.GatewayPaymentRepository;
import com.baalvion.payment.gateway.repository.GatewayWebhookEventRepository;
import com.baalvion.payment.gateway.spi.GatewayChargeRequest;
import com.baalvion.payment.gateway.spi.GatewayChargeResponse;
import com.baalvion.payment.gateway.spi.GatewayStatus;
import com.baalvion.payment.gateway.spi.PaymentGateway;
import com.baalvion.payment.gateway.spi.ProviderConfig;
import com.baalvion.payment.gateway.spi.RefundRequest;
import com.baalvion.payment.gateway.spi.RefundResult;
import com.baalvion.payment.gateway.spi.WebhookResult;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
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
  private final GatewayWebhookEventRepository webhookEventRepository;
  private final PspConfigResolver resolver;
  private final ObjectMapper objectMapper;

  /**
   * When true (default), a webhook whose amount does not match the recorded charge is REFUSED for
   * money-positive transitions. Set {@code app.psp.webhook-strict-amount=false} only to relax this
   * for a provider that legitimately omits amounts in its event payloads (logged loudly).
   */
  private final boolean webhookStrictAmount;

  public GatewayService(GatewayRegistry registry, GatewayPaymentRepository repository,
                        GatewayWebhookEventRepository webhookEventRepository,
                        PspConfigResolver resolver, ObjectMapper objectMapper,
                        @Value("${app.psp.webhook-strict-amount:true}") boolean webhookStrictAmount) {
    this.registry = registry;
    this.repository = repository;
    this.webhookEventRepository = webhookEventRepository;
    this.resolver = resolver;
    this.objectMapper = objectMapper;
    this.webhookStrictAmount = webhookStrictAmount;
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

  public GatewayPaymentResponse getById(String site, UUID id) {
    GatewayPayment payment = loadScoped(site, id);
    return GatewayPaymentResponse.from(payment);
  }

  public GatewayPaymentResponse capture(String site, UUID id) {
    GatewayPayment payment = loadScoped(site, id);

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

  public GatewayPaymentResponse refund(String site, UUID id, RefundGatewayPaymentRequest request) {
    GatewayPayment payment = loadScoped(site, id);

    BigDecimal refundAmount = request != null ? request.getAmount() : null;
    String reason = request != null ? request.getReason() : null;

    // A (partial) refund amount, when given, must be positive and cannot exceed the charge amount.
    // A full refund is requested with a null amount.
    if (refundAmount != null
        && (refundAmount.signum() <= 0 || refundAmount.compareTo(payment.getAmount()) > 0)) {
      throw new IllegalArgumentException(
        "Refund amount must be > 0 and <= the charge amount (" + payment.getAmount() + ")");
    }

    PaymentGateway gateway = registry.resolve(payment.getProvider());
    ProviderConfig cfg = resolver.resolve(siteOf(payment), payment.getProvider());

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
    String providerKey = provider.toLowerCase(Locale.ROOT);
    PaymentGateway gateway = registry.resolve(provider);
    ProviderConfig cfg = resolver.resolve(site, provider);

    // REAL signature + replay-window verification happens inside the adapter; it THROWS on failure
    // (WebhookVerificationException → 400). A returned result is always an authenticated event.
    WebhookResult result = gateway.verifyAndParseWebhook(rawBody, headers, cfg);

    String eventKey = dedupKey(result, providerKey);

    // Persistent, restart-surviving dedup: a provider redelivery or a replay beyond the adapter's
    // signature-timestamp window is acknowledged WITHOUT re-applying the status transition.
    if (webhookEventRepository.existsByWebsiteSlugAndProviderAndProviderEventId(slug, providerKey, eventKey)) {
      log.info("Duplicate webhook ignored (already processed): site={}, provider={}, eventId={}",
        sanitizeForLog(slug), providerKey, sanitizeForLog(eventKey));
      return result;
    }

    var chargeOpt = repository.findByWebsiteSlugAndProviderAndProviderRef(slug, providerKey, result.providerRef());
    if (chargeOpt.isEmpty()) {
      log.warn("Webhook for unknown charge: site={}, provider={}, providerRef={}, eventId={}",
        sanitizeForLog(slug), providerKey, result.providerRef(), sanitizeForLog(eventKey));
      return result;
    }
    GatewayPayment payment = chargeOpt.get();

    // STRICT amount validation BEFORE the status transition. A verified-but-tampered/replayed event
    // claiming a money-positive status for an amount that differs from the recorded charge is
    // refused — the charge is NOT marked paid and nothing is persisted (the transaction rolls back).
    boolean amountValidated = validateWebhookAmount(slug, providerKey, eventKey, payment, result);

    payment.setStatus(result.status());
    repository.save(payment);

    // Record the processed event. The UNIQUE(website_slug, provider, provider_event_id) constraint
    // is the backstop against the concurrent-delivery race (the loser's tx fails the INSERT and the
    // provider's retry then short-circuits on the exists check above).
    webhookEventRepository.save(GatewayWebhookEvent.builder()
      .websiteSlug(slug)
      .provider(providerKey)
      .providerEventId(eventKey)
      .providerRef(result.providerRef())
      .eventType(result.eventType())
      .status(result.status())
      .amount(result.amount())
      .currency(stringOrNull(result.payload().get("currency")))
      .amountValidated(amountValidated)
      .applied(true)
      .build());

    log.info("Webhook applied: site={}, provider={}, eventId={}, providerRef={}, status={}",
      sanitizeForLog(slug), providerKey, sanitizeForLog(eventKey), result.providerRef(), result.status());
    return result;
  }

  /**
   * Validate the event amount against the recorded charge for money-positive transitions.
   *
   * <ul>
   *   <li>CAPTURED / AUTHORIZED — event amount MUST equal the charge amount.</li>
   *   <li>REFUNDED — event amount, when present, must be in (0, charge amount].</li>
   *   <li>CREATED / FAILED — no amount check.</li>
   * </ul>
   *
   * @return whether the event amount was present and validated
   * @throws WebhookAmountMismatchException when strict validation fails (and strict mode is on)
   */
  private boolean validateWebhookAmount(String slug, String providerKey, String eventKey,
                                        GatewayPayment payment, WebhookResult result) {
    GatewayStatus status = result.status();
    BigDecimal eventAmount = result.amount();
    BigDecimal chargeAmount = payment.getAmount();

    if (status == GatewayStatus.CAPTURED || status == GatewayStatus.AUTHORIZED) {
      boolean matches = eventAmount != null && eventAmount.compareTo(chargeAmount) == 0;
      if (!matches) {
        log.error("Webhook amount mismatch — {} transition: site={}, provider={}, charge={}, expected={}, event={}, eventId={}",
          status, sanitizeForLog(slug), providerKey, payment.getId(), chargeAmount, eventAmount, sanitizeForLog(eventKey));
        if (webhookStrictAmount) {
          throw new WebhookAmountMismatchException(
            "Webhook amount " + eventAmount + " != charge amount " + chargeAmount + " for charge " + payment.getId());
        }
        log.warn("app.psp.webhook-strict-amount=false — applying {} despite amount mismatch (charge={})",
          status, payment.getId());
        return false;
      }
      return true;
    }

    if (status == GatewayStatus.REFUNDED && eventAmount != null) {
      boolean inBounds = eventAmount.signum() > 0 && eventAmount.compareTo(chargeAmount) <= 0;
      if (!inBounds) {
        log.error("Refund webhook amount out of bounds: site={}, charge={}, captured={}, refund={}, eventId={}",
          sanitizeForLog(slug), payment.getId(), chargeAmount, eventAmount, sanitizeForLog(eventKey));
        if (webhookStrictAmount) {
          throw new WebhookAmountMismatchException(
            "Refund amount " + eventAmount + " out of bounds (0, " + chargeAmount + "] for charge " + payment.getId());
        }
        return false;
      }
      return true;
    }

    return false;
  }

  /**
   * Non-null dedup key. Prefer the body-derived provider event id; when an adapter cannot supply
   * one, fall back to a deterministic key so duplicate deliveries of the same charge+status still
   * dedup (distinct statuses, e.g. captured then refunded, remain distinct events).
   */
  private static String dedupKey(WebhookResult result, String providerKey) {
    String id = result.providerEventId();
    if (id != null && !id.isBlank()) {
      return id;
    }
    return providerKey + ":" + result.providerRef() + ":"
      + (result.status() == null ? "?" : result.status().name());
  }

  private static String stringOrNull(Object value) {
    return value == null ? null : value.toString();
  }

  /**
   * Load a charge by id SCOPED TO THE CALLER'S SITE. Using the inherited findById here would let a
   * caller for site A read/capture/refund a charge owned by site B (cross-tenant IDOR on financial
   * records). A mismatch surfaces as "not found" rather than leaking the charge's existence.
   */
  private GatewayPayment loadScoped(String site, UUID id) {
    return repository.findByIdAndWebsiteSlug(id, slugOf(site))
      .orElseThrow(() -> new IllegalArgumentException("Gateway payment not found: " + id));
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
