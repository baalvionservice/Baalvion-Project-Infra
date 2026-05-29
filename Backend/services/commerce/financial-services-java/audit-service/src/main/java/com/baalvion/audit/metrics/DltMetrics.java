package com.baalvion.audit.metrics;

import com.baalvion.audit.domain.DltMessage.DltStatus;
import com.baalvion.audit.repository.DltMessageRepository;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Component;

/**
 * Exposes {@code dlt_messages_dead} for alerting (design §10.3) — the number of captured
 * dead-letter messages still awaiting replay/discard.
 */
@Component
public class DltMetrics {

  public DltMetrics(DltMessageRepository repository, MeterRegistry meterRegistry) {
    Gauge.builder("dlt.messages.dead", repository, r -> (double) r.countByStatus(DltStatus.DEAD))
      .description("Dead-letter messages awaiting replay or discard")
      .register(meterRegistry);
  }
}
