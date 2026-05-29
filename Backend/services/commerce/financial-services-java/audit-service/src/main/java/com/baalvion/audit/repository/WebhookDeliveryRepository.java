package com.baalvion.audit.repository;

import com.baalvion.audit.domain.WebhookDelivery;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface WebhookDeliveryRepository extends JpaRepository<WebhookDelivery, UUID> {

  /**
   * Claims due PENDING deliveries with {@code FOR UPDATE SKIP LOCKED} so multiple dispatcher
   * replicas drain concurrently without double-sending. Held until the transaction commits.
   */
  @Query(value = "SELECT * FROM audit.webhook_deliveries WHERE status = 'PENDING' "
    + "AND next_attempt_at <= :now ORDER BY next_attempt_at ASC LIMIT :limit FOR UPDATE SKIP LOCKED",
    nativeQuery = true)
  List<WebhookDelivery> lockDueBatch(@Param("now") LocalDateTime now, @Param("limit") int limit);

  @Query("SELECT d FROM WebhookDelivery d WHERE d.tenantId = :tenantId AND d.subscriptionId = :subscriptionId ORDER BY d.createdAt DESC")
  Page<WebhookDelivery> findBySubscription(@Param("tenantId") UUID tenantId, @Param("subscriptionId") UUID subscriptionId, Pageable pageable);
}
