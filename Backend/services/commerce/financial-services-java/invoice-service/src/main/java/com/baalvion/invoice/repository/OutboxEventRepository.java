package com.baalvion.invoice.repository;

import com.baalvion.invoice.domain.OutboxEvent;
import com.baalvion.invoice.domain.OutboxEvent.OutboxStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface OutboxEventRepository extends JpaRepository<OutboxEvent, UUID> {

  /**
   * Claim a batch of due, unpublished rows for this relay instance.
   *
   * {@code FOR UPDATE SKIP LOCKED} lets multiple instances drain concurrently without two of them
   * claiming the same row (no double-publish). Only rows whose {@code available_at} has passed are
   * returned, which is how bounded backoff defers retries. Runs in its OWN short transaction
   * (see {@link com.baalvion.invoice.service.OutboxRelay}); the row locks release the instant that
   * claim tx commits — before any Kafka I/O — and {@link #leaseClaimed} hides the rows from other
   * ticks/instances while they are being published.
   *
   * No RLS on outbox_events (relay reads cross-tenant), so this native scan is unfiltered by tenant.
   */
  @Query(value = "SELECT * FROM invoice.outbox_events " +
    "WHERE status = :status AND available_at <= :now " +
    "ORDER BY available_at ASC LIMIT :limit FOR UPDATE SKIP LOCKED", nativeQuery = true)
  List<OutboxEvent> claimDueBatch(
    @Param("status") String status,
    @Param("now") LocalDateTime now,
    @Param("limit") int limit
  );

  /**
   * Lease just-claimed rows by pushing {@code available_at} past the lease window so no other
   * tick/instance re-claims them while this relay is publishing. Status stays PENDING: if the relay
   * crashes mid-publish, the rows become claimable again once the lease elapses (at-least-once
   * delivery, never lost).
   */
  @Modifying
  @Query("UPDATE OutboxEvent o SET o.availableAt = :leaseUntil WHERE o.id IN :ids")
  void leaseClaimed(@Param("ids") List<UUID> ids, @Param("leaseUntil") LocalDateTime leaseUntil);

  long countByStatus(OutboxStatus status);
}
