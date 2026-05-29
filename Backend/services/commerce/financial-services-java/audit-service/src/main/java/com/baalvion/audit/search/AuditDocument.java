package com.baalvion.audit.search;

import com.baalvion.audit.domain.AuditLog;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.DateFormat;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Elasticsearch projection of an audit entry for compliance/operational search (design §6.4).
 * The document id equals the audit log id, so indexing is idempotent / replay-safe (re-index
 * overwrites the same doc). Postgres remains the system of record; this is a search index.
 *
 * The cluster applies an ILM policy + rollover write-alias for retention; this app writes to the
 * configured index ("baalvion-audit" by default).
 */
@Document(indexName = "${app.audit.es-index:baalvion-audit}", createIndex = true)
public class AuditDocument {

  @Id
  private String id;

  @Field(type = FieldType.Keyword)
  private String tenantId;

  @Field(type = FieldType.Keyword)
  private String eventType;

  @Field(type = FieldType.Keyword)
  private String aggregateType;

  @Field(type = FieldType.Keyword)
  private String aggregateId;

  @Field(type = FieldType.Keyword)
  private String action;

  @Field(type = FieldType.Keyword)
  private String actor;

  @Field(type = FieldType.Keyword)
  private String source;

  @Field(type = FieldType.Keyword)
  private String traceId;

  @Field(type = FieldType.Text)
  private String payload;

  @Field(type = FieldType.Date, format = DateFormat.date_hour_minute_second_millis)
  private LocalDateTime createdAt;

  public static AuditDocument from(AuditLog a) {
    AuditDocument d = new AuditDocument();
    d.id = a.getId() != null ? a.getId().toString() : UUID.randomUUID().toString();
    d.tenantId = str(a.getTenantId());
    d.eventType = a.getEventType();
    d.aggregateType = a.getAggregateType();
    d.aggregateId = a.getAggregateId();
    d.action = a.getAction();
    d.actor = a.getActor();
    d.source = a.getSource();
    d.traceId = a.getTraceId();
    d.payload = a.getPayload();
    d.createdAt = a.getCreatedAt();
    return d;
  }

  private static String str(Object o) {
    return o != null ? o.toString() : null;
  }

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getTenantId() { return tenantId; }
  public String getEventType() { return eventType; }
  public String getAggregateId() { return aggregateId; }
  public String getTraceId() { return traceId; }
  public LocalDateTime getCreatedAt() { return createdAt; }
}
