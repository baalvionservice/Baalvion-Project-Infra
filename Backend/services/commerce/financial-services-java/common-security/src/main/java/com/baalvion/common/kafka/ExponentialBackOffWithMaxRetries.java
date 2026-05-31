package com.baalvion.common.kafka;

import org.springframework.util.backoff.BackOffExecution;
import org.springframework.util.backoff.ExponentialBackOff;

/**
 * Count-bounded exponential backoff for Kafka {@code DefaultErrorHandler} retry/DLT wiring.
 *
 * <p>Spring Framework only ships {@code org.springframework.util.backoff.ExponentialBackOffWithMaxRetries}
 * from 6.2 onward (Spring Boot 3.4+). This suite is pinned to Spring Boot 3.2 / Spring Framework 6.1,
 * which provides {@link ExponentialBackOff} (bounded by elapsed time) but not a retry-count bound.
 * This backport restores the count-based semantics so a failed delivery is retried exactly
 * {@code maxRetries} times with exponentially growing intervals and then handed to the recoverer
 * (the dead-letter publisher), independent of wall-clock timing.
 *
 * <p>Behaviour is intentionally identical to the upstream class: it delegates interval computation
 * to {@link ExponentialBackOff} (so {@code initialInterval}, {@code multiplier} and {@code maxInterval}
 * are honoured) and returns {@link BackOffExecution#STOP} once {@code maxRetries} intervals have been
 * issued. When the Spring Boot baseline is raised to 3.4+, callers can switch the import back to the
 * framework class and delete this file.
 */
public class ExponentialBackOffWithMaxRetries extends ExponentialBackOff {

  private int maxRetries;

  public ExponentialBackOffWithMaxRetries(int maxRetries) {
    this.maxRetries = maxRetries;
  }

  public void setMaxRetries(int maxRetries) {
    this.maxRetries = maxRetries;
  }

  public int getMaxRetries() {
    return this.maxRetries;
  }

  @Override
  public BackOffExecution start() {
    return new MaxRetriesExecution(super.start());
  }

  /**
   * Wraps the parent's execution and caps the number of non-STOP intervals at {@code maxRetries}.
   * The parent keeps producing growing intervals; this wrapper only decides when to stop.
   */
  private class MaxRetriesExecution implements BackOffExecution {

    private final BackOffExecution delegate;
    private int attempts;

    MaxRetriesExecution(BackOffExecution delegate) {
      this.delegate = delegate;
    }

    @Override
    public long nextBackOff() {
      if (this.attempts >= maxRetries) {
        return BackOffExecution.STOP;
      }
      this.attempts++;
      return this.delegate.nextBackOff();
    }
  }
}
