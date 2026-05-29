package com.baalvion.audit.search;

import com.baalvion.audit.domain.AuditLog;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;

/**
 * Indexes audit entries into Elasticsearch for compliance/operational search (design §6.4),
 * active only when {@code app.audit.search=elasticsearch}.
 *
 * Fail-open and replay-safe: the document id equals the audit id (re-index overwrites), and any
 * indexing error is logged and swallowed — PostgreSQL is the system of record, so a search-index
 * outage must never block the audit write path. (Decouple via @Async if ES latency becomes a
 * concern; the call is intentionally best-effort.)
 */
@Slf4j
public class ElasticsearchAuditSearchPort implements AuditSearchPort {

  private final ElasticsearchOperations operations;

  public ElasticsearchAuditSearchPort(ElasticsearchOperations operations) {
    this.operations = operations;
  }

  @Override
  public void index(AuditLog entry) {
    try {
      operations.save(AuditDocument.from(entry));
    } catch (Exception e) {
      log.warn("Audit ES indexing failed (best-effort) for {}: {}", entry.getId(), e.getMessage());
    }
  }
}
