package com.baalvion.audit.search;

import com.baalvion.audit.domain.AuditLog;

/**
 * Outbound port for indexing audit entries into a search/analytics engine (design §6.4 —
 * Elasticsearch for compliance search). The system of record is PostgreSQL (JSONB + GIN);
 * this port lets an Elasticsearch indexer be added without touching {@code AuditService}.
 */
public interface AuditSearchPort {

  void index(AuditLog entry);
}
