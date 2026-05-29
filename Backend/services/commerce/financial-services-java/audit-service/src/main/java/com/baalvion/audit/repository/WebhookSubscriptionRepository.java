package com.baalvion.audit.repository;

import com.baalvion.audit.domain.WebhookSubscription;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WebhookSubscriptionRepository extends JpaRepository<WebhookSubscription, UUID> {

  @Query("SELECT s FROM WebhookSubscription s WHERE s.tenantId = :tenantId AND s.id = :id")
  Optional<WebhookSubscription> findByIdAndTenant(@Param("id") UUID id, @Param("tenantId") UUID tenantId);

  @Query("SELECT s FROM WebhookSubscription s WHERE s.tenantId = :tenantId ORDER BY s.createdAt DESC")
  Page<WebhookSubscription> findByTenant(@Param("tenantId") UUID tenantId, Pageable pageable);

  /** Active subscriptions for a tenant — the fan-out candidate set for an event. */
  @Query("SELECT s FROM WebhookSubscription s WHERE s.tenantId = :tenantId AND s.active = true")
  List<WebhookSubscription> findActiveByTenant(@Param("tenantId") UUID tenantId);
}
