/*
 * EXAMPLE (Phase 3) — Java payment-service stops writing gateway CHARGE state on webhooks
 * and instead emits a normalized event to the PCL inbound topic, consumed by jvm-saga.bridge.mjs.
 *
 * Refactor target:
 *   Backend/services/commerce/financial-services-java/payment-service/.../gateway/controller/WebhookController.java
 *   + GatewayService.applyWebhook(...)
 *
 * BEFORE: applyWebhook verified the signature, deduped via payments.gateway_webhook_events,
 *         then did `UPDATE payments.gateway_payments SET status=? WHERE provider_ref=?`.
 *
 * AFTER:  it verifies + dedupes (unchanged), then enqueues a PaymentEvent into the SAME
 *         transactional outbox it already runs (OutboxService/OutboxPublisher) on the PCL
 *         inbound topic. No direct charge-state UPDATE. The internal `payments.transactions`
 *         ledger saga is untouched — only the gateway charge write is removed.
 *
 * This reuses the EXISTING Java outbox + Kafka — no new infrastructure on the JVM side.
 */
package com.baalvion.payment.gateway.pcl;

import com.baalvion.payment.service.OutboxService;
import java.util.Map;
import java.util.UUID;

public final class JvmPclEmitter {

  /** Kafka topic the Node bridge (jvm-saga.bridge.mjs) consumes. */
  public static final String PCL_INBOUND_TOPIC = "pcl.events.inbound";

  private final OutboxService outbox;

  public JvmPclEmitter(OutboxService outbox) {
    this.outbox = outbox;
  }

  /**
   * Replaces the in-handler `UPDATE payments.gateway_payments SET status=...`. Called inside the
   * same @Transactional method that records the webhook in gateway_webhook_events, so the event
   * is emitted iff the dedupe row commits — the transactional-outbox guarantee, unchanged.
   *
   * @param nativeStatus the verified provider status: CAPTURED | AUTHORIZED | FAILED | SETTLED
   */
  public void emitChargeEvent(
      UUID tenantId,
      String websiteSlug,
      String provider,
      String chargeId,        // becomes PaymentEvent.paymentId (the charge grain)
      String providerEventId, // becomes PaymentEvent.transactionId (signed-body id)
      String nativeStatus,
      long amountMinor,
      String currency) {

    String eventType = switch (nativeStatus.toUpperCase()) {
      case "AUTHORIZED" -> "GATEWAY_AUTHORIZED";
      case "CAPTURED"   -> "GATEWAY_CAPTURED";
      case "SETTLED"    -> "GATEWAY_SETTLED";
      case "FAILED"     -> "PAYMENT_FAILED";
      default           -> null; // CREATED / REFUNDED etc. — not a v1 PCL transition
    };
    if (eventType == null) {
      return;
    }

    Map<String, Object> payment = Map.of(
        "type", eventType,
        "paymentId", chargeId,
        "provider", provider,
        "transactionId", providerEventId,
        "amount", amountMinor,
        "currency", currency,
        "orgId", websiteSlug
    );

    // Enqueue to the EXISTING outbox (payments.outbox_events) on the PCL inbound topic.
    outbox.enqueue(tenantId, PCL_INBOUND_TOPIC, chargeId, payment);
  }
}
