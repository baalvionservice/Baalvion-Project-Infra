package com.baalvion.reconciliation.inbound;

import com.baalvion.reconciliation.inbound.AdviceFileParser.ParsedAdvice;
import com.baalvion.reconciliation.service.ReconciliationService;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;

import java.util.List;

/**
 * Scheduled inbound advice ingestion (design §5.4). Each poll cycle drains the {@link AdviceSource},
 * parses each file, and submits a reconciliation run. Failures are isolated per file (poison
 * messages → error/quarantine), processing is idempotent (the run is keyed by runRef, so
 * re-ingesting the same file is a no-op), and counts are exported for alerting.
 *
 * Created only when {@code app.reconciliation.inbound.enabled=true} (see InboundIngestionConfig),
 * so no polling occurs by default.
 */
@Slf4j
public class InboundAdviceIngestionService {

  private final AdviceSource source;
  private final AdviceFileParser parser;
  private final ReconciliationService reconciliationService;
  private final Counter ingested;
  private final Counter failed;

  public InboundAdviceIngestionService(AdviceSource source, AdviceFileParser parser,
                                       ReconciliationService reconciliationService, MeterRegistry meterRegistry) {
    this.source = source;
    this.parser = parser;
    this.reconciliationService = reconciliationService;
    this.ingested = Counter.builder("reconciliation.advice.ingested").register(meterRegistry);
    this.failed = Counter.builder("reconciliation.advice.failed").register(meterRegistry);
  }

  @Scheduled(fixedDelayString = "${app.reconciliation.inbound.poll-ms:30000}")
  public void ingest() {
    List<AdviceFile> files = source.poll();
    for (AdviceFile file : files) {
      try {
        ParsedAdvice parsed = parser.parse(file.name(), file.content());
        reconciliationService.reconcile(parsed.tenantId(), parsed.request());
        source.archive(file.name());
        ingested.increment();
        log.info("Ingested advice file {} (run {})", file.name(), parsed.request().getRunRef());
      } catch (Exception e) {
        // Poison message: quarantine and continue with the rest of the batch.
        log.error("Rejecting advice file {} to error area: {}", file.name(), e.getMessage());
        source.reject(file.name());
        failed.increment();
      }
    }
  }
}
