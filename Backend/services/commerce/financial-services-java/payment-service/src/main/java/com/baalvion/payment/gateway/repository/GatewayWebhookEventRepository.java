package com.baalvion.payment.gateway.repository;

import com.baalvion.payment.gateway.domain.GatewayWebhookEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * Persistent webhook-event dedup ledger. The {@code existsBy...} check is the fast path for the
 * common duplicate-delivery case; the {@code uk_gateway_webhook_event} UNIQUE constraint is the
 * backstop for the rare concurrent-delivery race (the loser's transaction fails the INSERT and
 * the provider's retry then hits the exists check).
 */
@Repository
public interface GatewayWebhookEventRepository extends JpaRepository<GatewayWebhookEvent, UUID> {

  boolean existsByWebsiteSlugAndProviderAndProviderEventId(
    String websiteSlug, String provider, String providerEventId);
}
