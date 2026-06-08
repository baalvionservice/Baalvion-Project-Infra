package com.baalvion.ledger.repository;

import com.baalvion.ledger.domain.LedgerOutbox;
import com.baalvion.ledger.domain.LedgerOutbox.OutboxStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface LedgerOutboxRepository extends JpaRepository<LedgerOutbox, UUID> {

  /**
   * Claim a batch of due, unpublished rows for this relay instance.
   *
   * {@code FOR UPDATE SKIP LOCKED} lets multiple instances drain concurrently without two of
   * them claiming the same row (no double-publish). Only rows whose {@code available_at} has
   * passed are returned, which is how the bounded backoff defers retries.
   *
   * <p>This runs in its OWN short transaction (see {@link com.baalvion.ledger.service.LedgerOutboxRelay});
   * the row locks are released the instant that claim tx commits — well before any Kafka I/O —
   * so locks are never held across the broker round-trip. To stop a fast next poll tick (or
   * another instance) from re-claiming the same rows while they are being published, the relay
   * leases them with {@link #leaseClaimed} in the same claim tx.
   */
  @Query(value = "SELECT * FROM ledger.ledger_outbox " +
    "WHERE status = :status AND available_at <= :now " +
    "ORDER BY available_at ASC LIMIT :limit FOR UPDATE SKIP LOCKED", nativeQuery = true)
  List<LedgerOutbox> claimDueBatch(
    @Param("status") String status,
    @Param("now") LocalDateTime now,
    @Param("limit") int limit
  );

  /**
   * Lease the just-claimed rows by pushing {@code available_at} past the lease window, so no other
   * tick/instance re-claims them while this relay is publishing. Status stays PENDING: if this
   * relay crashes mid-publish, the rows become claimable again once the lease elapses (at-least-once
   * delivery, never lost).
   */
  @Modifying
  @Query("UPDATE LedgerOutbox o SET o.availableAt = :leaseUntil WHERE o.id IN :ids")
  void leaseClaimed(@Param("ids") List<UUID> ids, @Param("leaseUntil") LocalDateTime leaseUntil);

  long countByStatus(OutboxStatus status);
}
