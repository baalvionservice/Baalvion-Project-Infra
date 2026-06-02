package com.baalvion.dealroom.repository;

import com.baalvion.dealroom.domain.OutboxEvent;
import com.baalvion.dealroom.domain.OutboxEvent.OutboxStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OutboxEventRepository extends JpaRepository<OutboxEvent, UUID> {

  /** Claims a batch of PENDING events with native FOR UPDATE SKIP LOCKED (safe across replicas). */
  @Query(value = "SELECT * FROM deal_room.outbox_events WHERE status = :status " +
    "ORDER BY created_at ASC LIMIT :limit FOR UPDATE SKIP LOCKED", nativeQuery = true)
  List<OutboxEvent> lockPendingBatch(@Param("status") String status, @Param("limit") int limit);

  long countByStatus(OutboxStatus status);
}
