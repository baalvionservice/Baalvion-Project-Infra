package com.baalvion.intelligence.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/** A persisted supplier default-risk assessment (0-100, higher = riskier). */
@Entity
@Table(name = "supplier_risks", schema = "trade_intelligence")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupplierRisk {

  @Id
  @Column(columnDefinition = "uuid")
  @Builder.Default
  private UUID id = UUID.randomUUID();

  @Column(name = "tenant_id", nullable = false, columnDefinition = "uuid")
  private UUID tenantId;

  @Column(name = "supplier_id", nullable = false, columnDefinition = "uuid")
  private UUID supplierId;

  @Column(name = "supplier_name", length = 255)
  private String supplierName;

  @Column(nullable = false, precision = 5, scale = 2)
  private BigDecimal score;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 10)
  private RiskGrade grade;

  @Column(name = "early_warning", nullable = false)
  @Builder.Default
  private boolean earlyWarning = false;

  @Column(columnDefinition = "jsonb", nullable = false)
  @Builder.Default
  private String factors = "{}";

  @Column(columnDefinition = "TEXT")
  private String summary;

  @Column(length = 40)
  private String provider;

  @CreationTimestamp
  @Column(name = "assessed_at", nullable = false, updatable = false)
  private LocalDateTime assessedAt;

  public enum RiskGrade { LOW, MEDIUM, HIGH, CRITICAL }
}
