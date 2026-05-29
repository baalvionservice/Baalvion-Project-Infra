package com.baalvion.audit.search;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;

/**
 * Selects the audit search indexer: Elasticsearch when {@code app.audit.search=elasticsearch}
 * (requires {@code spring.elasticsearch.uris}); otherwise a no-op (PostgreSQL JSONB + GIN is the
 * search store). Deterministic bean wiring — no component-scan ordering ambiguity.
 */
@Configuration
public class AuditSearchConfig {

  @Bean
  @ConditionalOnProperty(name = "app.audit.search", havingValue = "elasticsearch")
  public AuditSearchPort elasticsearchAuditSearchPort(ElasticsearchOperations operations) {
    return new ElasticsearchAuditSearchPort(operations);
  }

  @Bean
  @ConditionalOnMissingBean(AuditSearchPort.class)
  public AuditSearchPort noOpAuditSearchPort() {
    return new NoOpAuditSearchPort();
  }
}
