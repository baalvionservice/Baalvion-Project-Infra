package com.baalvion.dealroom.dto;

import com.baalvion.dealroom.domain.CounterOffer;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class CounterOfferResponse {
  private UUID id;
  private UUID dealId;
  private int round;
  private String offeredBy;
  private BigDecimal price;
  private BigDecimal quantity;
  private String unit;
  private String currency;
  private String incoterm;
  private String deliveryTerms;
  private String paymentTerms;
  private String message;
  private String status;
  private LocalDateTime validUntil;
  private LocalDateTime createdAt;
  private LocalDateTime decidedAt;

  public static CounterOfferResponse from(CounterOffer o) {
    return CounterOfferResponse.builder()
      .id(o.getId()).dealId(o.getDealId()).round(o.getRound())
      .offeredBy(o.getOfferedBy() != null ? o.getOfferedBy().name() : null)
      .price(o.getPrice()).quantity(o.getQuantity()).unit(o.getUnit())
      .currency(o.getCurrency()).incoterm(o.getIncoterm())
      .deliveryTerms(o.getDeliveryTerms()).paymentTerms(o.getPaymentTerms()).message(o.getMessage())
      .status(o.getStatus() != null ? o.getStatus().name() : null)
      .validUntil(o.getValidUntil()).createdAt(o.getCreatedAt()).decidedAt(o.getDecidedAt())
      .build();
  }
}
