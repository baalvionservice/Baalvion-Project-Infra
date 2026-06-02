package com.baalvion.tradefinance.repository;

import com.baalvion.tradefinance.domain.OutboxEvent;
import com.baalvion.tradefinance.domain.OutboxEvent.OutboxStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OutboxEventRepository extends JpaRepository<OutboxEvent, UUID> {

  /**
   * Claims a batch of PENDING events using native FOR UPDATE SKIP LOCKED so multiple publisher
   * replicas never grab the same row.
   */
  @Query(value = "SELECT * FROM trade_finance.outbox_events WHERE status = :status " +
    "ORDER BY created_at ASC LIMIT :limit FOR UPDATE SKIP LOCKED", nativeQuery = true)
  List<OutboxEvent> lockPendingBatch(@Param("status") String status, @Param("limit") int limit);

  long countByStatus(OutboxStatus status);
}
