package com.baalvion.audit.webhook;

import com.baalvion.audit.domain.WebhookDelivery;
import com.baalvion.audit.domain.WebhookDelivery.DeliveryStatus;
import com.baalvion.audit.domain.WebhookSubscription;
import com.baalvion.audit.repository.WebhookDeliveryRepository;
import com.baalvion.audit.repository.WebhookSubscriptionRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Delivers pending webhooks with HMAC-SHA256 signatures and retry/backoff, then dead-letters
 * after {@code max-attempts} (design §7.2, §4.3). Due deliveries are claimed with
 * {@code FOR UPDATE SKIP LOCKED} so replicas dispatch concurrently and safely. The delivery id
 * is sent as {@code X-Webhook-Id} for subscriber-side idempotency.
 */
@Slf4j
@Service
public class WebhookDispatcher {

  private final WebhookDeliveryRepository deliveries;
  private final WebhookSubscriptionRepository subscriptions;
  private final WebhookSigner signer;
  private final HttpClient httpClient;

  @Value("${app.webhook.batch-size:50}")
  private int batchSize;

  @Value("${app.webhook.max-attempts:8}")
  private int maxAttempts;

  @Value("${app.webhook.request-timeout-ms:5000}")
  private long requestTimeoutMs;

  @Value("${app.webhook.backoff-cap-seconds:3600}")
  private long backoffCapSeconds;

  public WebhookDispatcher(WebhookDeliveryRepository deliveries, WebhookSubscriptionRepository subscriptions, WebhookSigner signer) {
    this.deliveries = deliveries;
    this.subscriptions = subscriptions;
    this.signer = signer;
    this.httpClient = HttpClient.newBuilder()
      .connectTimeout(Duration.ofSeconds(5))
      .followRedirects(HttpClient.Redirect.NEVER)
      .build();
  }

  @Scheduled(fixedDelayString = "${app.webhook.poll-ms:3000}")
  @Transactional
  public void dispatch() {
    List<WebhookDelivery> due = deliveries.lockDueBatch(LocalDateTime.now(), batchSize);
    if (due.isEmpty()) {
      return;
    }
    for (WebhookDelivery delivery : due) {
      attempt(delivery);
    }
    deliveries.saveAll(due);
  }

  private void attempt(WebhookDelivery delivery) {
    delivery.setAttempts(delivery.getAttempts() + 1);

    WebhookSubscription sub = subscriptions.findByIdAndTenant(delivery.getSubscriptionId(), delivery.getTenantId()).orElse(null);
    if (sub == null || !sub.isActive()) {
      fail(delivery, "Subscription missing or inactive", null);
      delivery.setStatus(DeliveryStatus.FAILED);
      return;
    }

    try {
      String signature = signer.sign(sub.getSecret(), delivery.getPayload());
      HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create(delivery.getUrl()))
        .timeout(Duration.ofMillis(requestTimeoutMs))
        .header("Content-Type", "application/json")
        .header("X-Webhook-Id", delivery.getId().toString())
        .header("X-Webhook-Event", delivery.getEventType())
        .header("X-Webhook-Timestamp", String.valueOf(System.currentTimeMillis()))
        .header("X-Webhook-Signature", signature)
        .POST(HttpRequest.BodyPublishers.ofString(delivery.getPayload()))
        .build();

      HttpResponse<Void> response = httpClient.send(request, HttpResponse.BodyHandlers.discarding());
      delivery.setResponseStatus(response.statusCode());
      if (response.statusCode() >= 200 && response.statusCode() < 300) {
        delivery.setStatus(DeliveryStatus.DELIVERED);
        delivery.setDeliveredAt(LocalDateTime.now());
        delivery.setLastError(null);
        log.info("Webhook delivered: id={}, sub={}, status={}", delivery.getId(), sub.getId(), response.statusCode());
      } else {
        scheduleRetryOrFail(delivery, "HTTP " + response.statusCode());
      }
    } catch (Exception e) {
      scheduleRetryOrFail(delivery, e.getClass().getSimpleName() + ": " + e.getMessage());
    }
  }

  private void scheduleRetryOrFail(WebhookDelivery delivery, String error) {
    if (delivery.getAttempts() >= maxAttempts) {
      fail(delivery, error, null);
      delivery.setStatus(DeliveryStatus.FAILED);
      log.error("Webhook delivery {} exhausted {} attempts → FAILED: {}", delivery.getId(), maxAttempts, error);
    } else {
      long backoff = Math.min((long) Math.pow(2, delivery.getAttempts()), backoffCapSeconds);
      delivery.setNextAttemptAt(LocalDateTime.now().plusSeconds(backoff));
      delivery.setLastError(error);
      log.warn("Webhook delivery {} attempt {} failed ({}); retrying in {}s", delivery.getId(), delivery.getAttempts(), error, backoff);
    }
  }

  private void fail(WebhookDelivery delivery, String error, Integer status) {
    delivery.setLastError(error);
    if (status != null) {
      delivery.setResponseStatus(status);
    }
  }
}
