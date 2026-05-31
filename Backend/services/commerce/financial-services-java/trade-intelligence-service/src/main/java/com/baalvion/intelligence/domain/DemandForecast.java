package com.baalvion.intelligence.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/** A persisted demand forecast for a commodity/region over a horizon. */
@Entity
@Table(name = "demand_forecasts", schema = "trade_intelligence")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DemandForecast {

  @Id
  @Column(columnDefinition = "uuid")
  @Builder.Default
  private UUID id = UUID.randomUUID();

  @Column(name = "tenant_id", nullable = false, columnDefinition = "uuid")
  private UUID tenantId;

  @Column(nullable = false, length = 255)
  private String commodity;

  @Column(length = 64)
  private String region;

  @Column(name = "horizon_days", nullable = false)
  private int horizonDays;

  @Column(name = "predicted_total", precision = 19, scale = 4)
  private BigDecimal predictedTotal;

  @Column(length = 20)
  private String unit;

  @Column(precision = 5, scale = 4)
  private BigDecimal confidence;

  @Column(columnDefinition = "jsonb", nullable = false)
  @Builder.Default
  private String points = "[]";

  @Column(length = 40)
  private String provider;

  @CreationTimestamp
  @Column(name = "generated_at", nullable = false, updatable = false)
  private LocalDateTime generatedAt;

  @Column(columnDefinition = "jsonb", nullable = false)
  @Builder.Default
  private String metadata = "{}";
}
