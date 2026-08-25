package com.baalvion.wallet.repository;

import com.baalvion.wallet.domain.WalletBillingWebhookEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface WalletBillingWebhookEventRepository extends JpaRepository<WalletBillingWebhookEvent, UUID> {

  Optional<WalletBillingWebhookEvent> findByProviderAndEventId(String provider, String eventId);
}
