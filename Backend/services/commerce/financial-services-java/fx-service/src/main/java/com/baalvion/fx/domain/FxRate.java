package com.baalvion.fx.domain;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Latest published rate snapshot for a currency pair (shared market reference data, not tenant
 * scoped). 1 unit of {@link #baseCurrency} buys {@code rate} units of {@link #quoteCurrency}.
 */
@Entity
@Table(name = "fx_rates", schema = "fx")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FxRate {

  @Id
  @Column(columnDefinition = "uuid")
  @Builder.Default
  private UUID id = UUID.randomUUID();

  @Column(name = "base_currency", nullable = false, length = 3)
  private String baseCurrency;

  @Column(name = "quote_currency", nullable = false, length = 3)
  private String quoteCurrency;

  @Column(name = "mid_rate", nullable = false, precision = 19, scale = 8)
  private BigDecimal midRate;

  @Column(name = "bid_rate", nullable = false, precision = 19, scale = 8)
  private BigDecimal bidRate;

  @Column(name = "ask_rate", nullable = false, precision = 19, scale = 8)
  private BigDecimal askRate;

  @Column(nullable = false, length = 40)
  private String source;

  @Column(name = "as_of", nullable = false)
  private LocalDateTime asOf;

  @Column(name = "ttl_seconds", nullable = false)
  private int ttlSeconds;
}
