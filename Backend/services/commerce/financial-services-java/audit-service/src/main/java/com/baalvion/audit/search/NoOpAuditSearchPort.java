package com.baalvion.audit.search;

import com.baalvion.audit.domain.AuditLog;

/**
 * Default no-op indexer: audit search runs off PostgreSQL (JSONB + GIN) until Elasticsearch is
 * enabled via {@code app.audit.search=elasticsearch}. Selected by {@link AuditSearchConfig}.
 */
public class NoOpAuditSearchPort implements AuditSearchPort {

  @Override
  public void index(AuditLog entry) {
    // intentionally no-op; PostgreSQL is the search store today
  }
}
