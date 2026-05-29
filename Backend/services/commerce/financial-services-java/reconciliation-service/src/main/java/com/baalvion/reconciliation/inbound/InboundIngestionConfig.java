package com.baalvion.reconciliation.inbound;

import com.baalvion.reconciliation.service.ReconciliationService;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

/**
 * Wires inbound advice ingestion only when {@code app.reconciliation.inbound.enabled=true}, so
 * by default no poller runs and no SFTP connection is attempted. The source is local-directory
 * unless {@code app.reconciliation.inbound.source=sftp}.
 */
@Configuration
@ConditionalOnProperty(name = "app.reconciliation.inbound.enabled", havingValue = "true")
public class InboundIngestionConfig {

  @Bean
  public AdviceSource adviceSource(Environment env) {
    String type = env.getProperty("app.reconciliation.inbound.source", "local");
    if ("sftp".equalsIgnoreCase(type)) {
      return new SftpAdviceSource(
        env.getRequiredProperty("app.reconciliation.inbound.sftp.host"),
        env.getProperty("app.reconciliation.inbound.sftp.port", Integer.class, 22),
        env.getRequiredProperty("app.reconciliation.inbound.sftp.username"),
        env.getProperty("app.reconciliation.inbound.sftp.password", ""),
        env.getProperty("app.reconciliation.inbound.sftp.private-key-path", ""),
        env.getProperty("app.reconciliation.inbound.sftp.known-hosts-path", ""),
        env.getProperty("app.reconciliation.inbound.sftp.host-key-fingerprint", ""),
        env.getProperty("app.reconciliation.inbound.sftp.insecure-allow-any-host-key", Boolean.class, false),
        env.getProperty("app.reconciliation.inbound.sftp.inbound-dir", "/inbound"),
        env.getProperty("app.reconciliation.inbound.sftp.archive-dir", "/inbound/archive"),
        env.getProperty("app.reconciliation.inbound.sftp.error-dir", "/inbound/error"),
        env.getProperty("app.reconciliation.inbound.sftp.connect-timeout-ms", Integer.class, 10000));
    }
    return new LocalDirectoryAdviceSource(
      env.getProperty("app.reconciliation.inbound.dir", "./inbound/reconciliation"),
      env.getProperty("app.reconciliation.inbound.quiet-period-ms", Long.class, 5000L));
  }

  @Bean
  public InboundAdviceIngestionService inboundAdviceIngestionService(
    AdviceSource adviceSource, AdviceFileParser parser,
    ReconciliationService reconciliationService, MeterRegistry meterRegistry) {
    return new InboundAdviceIngestionService(adviceSource, parser, reconciliationService, meterRegistry);
  }
}
