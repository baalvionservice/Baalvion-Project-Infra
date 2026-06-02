package com.baalvion.audit.webhook;

import com.baalvion.audit.domain.WebhookDelivery;
import com.baalvion.audit.domain.WebhookSubscription;
import com.baalvion.audit.dto.WebhookDeliveryResponse;
import com.baalvion.audit.dto.WebhookSubscriptionResponse;
import com.baalvion.audit.repository.WebhookDeliveryRepository;
import com.baalvion.audit.repository.WebhookSubscriptionRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;
import java.util.regex.PatternSyntaxException;

/**
 * Manages webhook subscriptions and enqueues signed deliveries when domain events are
 * aggregated. Delivery itself is performed asynchronously by {@link WebhookDispatcher}.
 */
@Slf4j
@Service
@Transactional
public class WebhookService {

  private final WebhookSubscriptionRepository subscriptions;
  private final WebhookDeliveryRepository deliveries;
  private final SecureRandom random = new SecureRandom();

  public WebhookService(WebhookSubscriptionRepository subscriptions, WebhookDeliveryRepository deliveries) {
    this.subscriptions = subscriptions;
    this.deliveries = deliveries;
  }

  public WebhookSubscriptionResponse register(UUID tenantId, String url, String secret, String eventPattern) {
    if (eventPattern != null && !eventPattern.isBlank()) {
      validatePattern(eventPattern);
    }
    String effectiveSecret = (secret != null && !secret.isBlank()) ? secret : generateSecret();
    var sub = subscriptions.save(WebhookSubscription.builder()
      .tenantId(tenantId)
      .url(url)
      .secret(effectiveSecret)
      .eventPattern(eventPattern)
      .active(true)
      .build());
    log.info("Webhook subscription registered: id={}, tenant={}, url={}, pattern={}",
      sub.getId(), tenantId, sanitizeForLog(url), sanitizeForLog(eventPattern));
    // Secret returned exactly once, on creation.
    return mapSub(sub, effectiveSecret);
  }

  @Transactional(readOnly = true)
  public Page<WebhookSubscriptionResponse> list(UUID tenantId, int page, int size) {
    return subscriptions.findByTenant(tenantId, PageRequest.of(page, size)).map(s -> mapSub(s, null));
  }

  public WebhookSubscriptionResponse deactivate(UUID tenantId, UUID id) {
    var sub = subscriptions.findByIdAndTenant(id, tenantId)
      .orElseThrow(() -> new IllegalArgumentException("Webhook subscription not found: " + id));
    sub.setActive(false);
    return mapSub(subscriptions.save(sub), null);
  }

  @Transactional(readOnly = true)
  public Page<WebhookDeliveryResponse> deliveries(UUID tenantId, UUID subscriptionId, int page, int size) {
    return deliveries.findBySubscription(tenantId, subscriptionId, PageRequest.of(page, size)).map(this::mapDelivery);
  }

  /**
   * Fan-out: for every active subscription whose pattern matches the event type, create a
   * PENDING delivery. Called from the audit aggregation path, so it commits atomically with the
   * audit record (no event is fanned out unless it was durably recorded).
   */
  public void fanOut(UUID tenantId, String eventType, String payloadJson) {
    List<WebhookSubscription> active = subscriptions.findActiveByTenant(tenantId);
    for (WebhookSubscription sub : active) {
      if (matches(sub.getEventPattern(), eventType)) {
        deliveries.save(WebhookDelivery.builder()
          .tenantId(tenantId)
          .subscriptionId(sub.getId())
          .url(sub.getUrl())
          .eventType(eventType)
          .payload(payloadJson != null ? payloadJson : "{}")
          .status(WebhookDelivery.DeliveryStatus.PENDING)
          .attempts(0)
          .build());
      }
    }
  }

  private boolean matches(String pattern, String eventType) {
    if (pattern == null || pattern.isBlank()) {
      return true;
    }
    try {
      return Pattern.matches(pattern, eventType);
    } catch (PatternSyntaxException e) {
      return false;
    }
  }

  private void validatePattern(String pattern) {
    try {
      Pattern.compile(pattern);
    } catch (PatternSyntaxException e) {
      throw new IllegalArgumentException("Invalid eventPattern regex: " + e.getMessage());
    }
  }

  private String generateSecret() {
    byte[] bytes = new byte[32];
    random.nextBytes(bytes);
    return HexFormat.of().formatHex(bytes);
  }

  private WebhookSubscriptionResponse mapSub(WebhookSubscription s, String secretOrNull) {
    return WebhookSubscriptionResponse.builder()
      .id(s.getId())
      .tenantId(s.getTenantId())
      .url(s.getUrl())
      .eventPattern(s.getEventPattern())
      .active(s.isActive())
      .secret(secretOrNull)
      .createdAt(s.getCreatedAt())
      .build();
  }

  private WebhookDeliveryResponse mapDelivery(WebhookDelivery d) {
    return WebhookDeliveryResponse.builder()
      .id(d.getId())
      .subscriptionId(d.getSubscriptionId())
      .eventType(d.getEventType())
      .status(d.getStatus().name())
      .attempts(d.getAttempts())
      .responseStatus(d.getResponseStatus())
      .lastError(d.getLastError())
      .nextAttemptAt(d.getNextAttemptAt())
      .deliveredAt(d.getDeliveredAt())
      .createdAt(d.getCreatedAt())
      .build();
  }
}
