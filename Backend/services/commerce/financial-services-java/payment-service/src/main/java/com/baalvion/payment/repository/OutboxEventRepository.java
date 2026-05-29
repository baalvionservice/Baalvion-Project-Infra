package com.baalvion.payment.repository;

import com.baalvion.payment.domain.OutboxEvent;
import com.baalvion.payment.domain.OutboxEvent.OutboxStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OutboxEventRepository extends JpaRepository<OutboxEvent, UUID> {

  /**
   * Claims a batch of pending events with {@code FOR UPDATE SKIP LOCKED}, so multiple
   * publisher replicas can drain the outbox concurrently without contending or
   * double-publishing. Rows stay locked until the surrounding transaction commits.
   */
  @Query(value = "SELECT * FROM payments.outbox_events WHERE status = :status "
    + "ORDER BY created_at ASC LIMIT :limit FOR UPDATE SKIP LOCKED", nativeQuery = true)
  List<OutboxEvent> lockPendingBatch(@Param("status") String status, @Param("limit") int limit);

  @Query("SELECT COUNT(e) FROM OutboxEvent e WHERE e.status = :status")
  long countByStatus(@Param("status") OutboxStatus status);
}
