package com.baalvion.reporting.domain;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * ReportJob: An async report export request and its result.
 *
 * The rendered artifact lives in {@code content} (inline text for CSV/JSON, Base64 for
 * binary formats such as XLSX, flagged by {@code binaryContent}).
 */
@Entity
@Table(
  name = "report_jobs",
  schema = "reporting",
  indexes = {
    @Index(name = "idx_tenant_status_date", columnList = "tenant_id,status,created_at DESC"),
    @Index(name = "idx_tenant_type", columnList = "tenant_id,report_type")
  },
  uniqueConstraints = {
    @UniqueConstraint(name = "uk_report_ref", columnNames = {"report_ref", "tenant_id"})
  }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportJob {

  @Id
  @Column(columnDefinition = "uuid")
  private UUID id;

  @NotNull
  @Column(columnDefinition = "uuid", nullable = false)
  private UUID tenantId;

  @NotBlank
  @Size(max = 64)
  @Column(length = 64, nullable = false)
  private String reportRef;

  @NotBlank
  @Size(max = 64)
  @Column(length = 64, nullable = false)
  private String reportType;

  @NotNull
  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private ReportFormat format;

  @NotNull
  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private ReportStatus status;

  @Column(columnDefinition = "jsonb", nullable = false)
  private String parameters;

  @Column(nullable = false)
  private int rowCount;

  @Column(columnDefinition = "TEXT")
  private String content;

  @Column(nullable = false)
  private boolean binaryContent;

  @Size(max = 128)
  @Column(length = 128)
  private String contentType;

  @Size(max = 160)
  @Column(length = 160)
  private String fileName;

  @Column(columnDefinition = "TEXT")
  private String failureReason;

  @Size(max = 128)
  @Column(length = 128)
  private String requestedBy;

  @CreationTimestamp
  @Column(nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @UpdateTimestamp
  @Column(nullable = false)
  private LocalDateTime updatedAt;

  @Column
  private LocalDateTime completedAt;

  @Version
  private Long version;

  public enum ReportFormat {
    CSV,
    JSON,
    XLSX
  }

  public enum ReportStatus {
    PENDING,
    PROCESSING,
    COMPLETED,
    FAILED
  }

  @PrePersist
  protected void onCreate() {
    if (id == null) {
      id = UUID.randomUUID();
    }
    if (parameters == null) {
      parameters = "{}";
    }
  }
}
