package com.baalvion.ledger.service;

import com.baalvion.ledger.domain.LedgerOutbox;
import com.baalvion.ledger.domain.LedgerOutbox.OutboxStatus;
import com.baalvion.ledger.repository.LedgerOutboxRepository;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Drains the ledger transactional outbox to Kafka.
 *
 * <p>Canonical three-phase relay so DB row locks are never held across broker I/O:
 * <ol>
 *   <li><b>Claim</b> ({@code claimBatch}, its own short {@code REQUIRES_NEW} tx):
 *       {@code FOR UPDATE SKIP LOCKED} selects due PENDING rows so replicas don't double-claim,
 *       then leases them by pushing {@code available_at} past a lease window. That tx commits
 *       immediately, releasing the locks before any Kafka call.</li>
 *   <li><b>Publish</b> ({@code publish}, OUTSIDE any transaction): each row is sent synchronously
 *       ({@code .get(timeout)}) so a failure is observed, never swallowed.</li>
 *   <li><b>Persist</b> ({@code persistResult}, one short {@code REQUIRES_NEW} tx PER ROW): records
 *       SENT, or increments attempts + bounded-exponential backoff + {@code last_error}, or FAILED
 *       after {@code maxAttempts}. Per-row tx means one row's failure can't roll back another's
 *       SENT status, and a broker ack is committed before the next row is even attempted, so a
 *       later crash never re-publishes already-acked rows.</li>
 * </ol>
 *
 * <p>Delivery is at-least-once: if the relay crashes after a broker ack but before persisting SENT,
 * the lease eventually elapses and the row is re-published. Downstream consumers already dedupe on
 * the journal id (the Kafka key), so this is safe.
 */
@Slf4j
@Service
public class LedgerOutboxRelay {

  private final LedgerOutboxRepository repository;
  private final KafkaTemplate<String, String> kafkaTemplate;
  /**
   * Self-reference so the {@code REQUIRES_NEW} boundaries on {@code claimBatch}/{@code persistResult}
   * actually go through the Spring transactional proxy. Calling them via plain {@code this} would
   * be self-invocation and silently skip the proxy, collapsing the three short transactions back
   * into one — the very bug Finding 3 fixes. {@code @Lazy} breaks the construction cycle.
   */
  private final LedgerOutboxRelay self;

  @Value("${app.outbox.batch-size:100}")
  private int batchSize;

  @Value("${app.outbox.max-attempts:10}")
  private int maxAttempts;

  @Value("${app.outbox.send-timeout-ms:10000}")
  private long sendTimeoutMs;

  @Value("${app.outbox.backoff-base-ms:2000}")
  private long backoffBaseMs;

  @Value("${app.outbox.backoff-max-ms:300000}")
  private long backoffMaxMs;

  /** How long a claimed-but-not-yet-published row is hidden from other ticks/instances. */
  @Value("${app.outbox.lease-ms:60000}")
  private long leaseMs;

  public LedgerOutboxRelay(
    LedgerOutboxRepository repository,
    KafkaTemplate<String, String> kafkaTemplate,
    MeterRegistry meterRegistry,
    @Lazy LedgerOutboxRelay self
  ) {
    this.repository = repository;
    this.kafkaTemplate = kafkaTemplate;
    this.self = self;
    Gauge.builder("ledger.outbox.pending", repository, r -> (double) r.countByStatus(OutboxStatus.PENDING))
      .description("Ledger outbox events awaiting publication")
      .register(meterRegistry);
  }

  /**
   * Scheduled entry point. Deliberately NOT {@code @Transactional}: the three phases each open
   * their own short transaction (or none), so no DB lock is ever held across the Kafka round-trip.
   */
  @Scheduled(fixedDelayString = "${app.outbox.poll-ms:2000}")
  public void drain() {
    // Via `self` so the REQUIRES_NEW proxy boundary is honored (not self-invocation).
    List<LedgerOutbox> batch = self.claimBatch();
    if (batch.isEmpty()) {
      return;
    }
    for (LedgerOutbox event : batch) {
      // Publish OUTSIDE any transaction, then persist the outcome in its own short tx.
      self.persistResult(event, publish(event));
    }
  }

  /**
   * Phase 1 — claim + lease in a short, dedicated transaction that commits (releasing the row
   * locks) before any broker I/O. Detaches the returned rows for lock-free publishing.
   */
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public List<LedgerOutbox> claimBatch() {
    List<LedgerOutbox> batch = repository.claimDueBatch(
      OutboxStatus.PENDING.name(), LocalDateTime.now(), batchSize);
    if (batch.isEmpty()) {
      return List.of();
    }
    List<java.util.UUID> ids = batch.stream().map(LedgerOutbox::getId).toList();
    repository.leaseClaimed(ids, LocalDateTime.now().plusNanos(leaseMs * 1_000_000L));
    return batch;
  }

  /** Phase 2 — publish one row synchronously, OUTSIDE any transaction. Returns the failure, or null on success. */
  private Exception publish(LedgerOutbox event) {
    try {
      // Synchronous: block on the broker ack so a failure is observed here, never swallowed.
      kafkaTemplate.send(event.getTopic(), event.getMsgKey(), event.getPayload())
        .get(sendTimeoutMs, TimeUnit.MILLISECONDS);
      return null;
    } catch (Exception e) {
      return e;
    }
  }

  /**
   * Phase 3 — persist this single row's outcome in its OWN short transaction, so one row's failure
   * never rolls back another row's committed SENT status.
   */
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void persistResult(LedgerOutbox event, Exception failure) {
    if (failure == null) {
      event.setStatus(OutboxStatus.SENT);
      event.setSentAt(LocalDateTime.now());
    } else {
      recordFailure(event, failure);
    }
    repository.save(event);
  }

  private void recordFailure(LedgerOutbox event, Exception e) {
    int attempts = event.getAttempts() + 1;
    event.setAttempts(attempts);
    event.setLastError(sanitize(truncate(e.getMessage())));
    if (attempts >= maxAttempts) {
      event.setStatus(OutboxStatus.FAILED);
      log.error("Outbox event {} exhausted retries ({}); marking FAILED: topic={}, key={}: {}",
        event.getId(), maxAttempts, event.getTopic(), event.getMsgKey(), e.getMessage());
    } else {
      event.setAvailableAt(LocalDateTime.now().plusNanos(backoffMillis(attempts) * 1_000_000L));
      log.warn("Outbox publish failed (attempt {}/{}): topic={}, key={}: {}",
        attempts, maxAttempts, event.getTopic(), event.getMsgKey(), e.getMessage());
    }
  }

  /** Bounded exponential backoff: base * 2^(attempts-1), capped at backoffMaxMs. */
  private long backoffMillis(int attempts) {
    long shift = Math.min(attempts - 1, 20); // guard against overflow on the shift
    long delay = backoffBaseMs << shift;
    if (delay <= 0 || delay > backoffMaxMs) {
      return backoffMaxMs;
    }
    return delay;
  }

  private static String truncate(String msg) {
    if (msg == null) {
      return null;
    }
    return msg.length() <= 2000 ? msg : msg.substring(0, 2000);
  }

  /** Strip CR/LF/tab before persisting to {@code last_error} (log/record injection), matching LedgerService. */
  private static String sanitize(String msg) {
    return msg == null ? null : msg.replaceAll("[\r\n\t]", "_");
  }
}
