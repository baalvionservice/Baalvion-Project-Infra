package com.baalvion.dealroom.dto;

import com.baalvion.dealroom.domain.TermSheet;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class TermSheetResponse {
  private UUID id;
  private UUID dealId;
  private int version;
  private BigDecimal price;
  private BigDecimal quantity;
  private String unit;
  private String currency;
  private BigDecimal totalValue;
  private String incoterm;
  private String paymentTerms;
  private String deliveryTerms;
  private LocalDate deliveryDate;
  private String status;
  private LocalDateTime buyerSignedAt;
  private LocalDateTime sellerSignedAt;
  private LocalDateTime executedAt;
  private LocalDateTime createdAt;

  public static TermSheetResponse from(TermSheet t) {
    return TermSheetResponse.builder()
      .id(t.getId()).dealId(t.getDealId()).version(t.getVersion())
      .price(t.getPrice()).quantity(t.getQuantity()).unit(t.getUnit())
      .currency(t.getCurrency()).totalValue(t.getTotalValue()).incoterm(t.getIncoterm())
      .paymentTerms(t.getPaymentTerms()).deliveryTerms(t.getDeliveryTerms()).deliveryDate(t.getDeliveryDate())
      .status(t.getStatus() != null ? t.getStatus().name() : null)
      .buyerSignedAt(t.getBuyerSignedAt()).sellerSignedAt(t.getSellerSignedAt())
      .executedAt(t.getExecutedAt()).createdAt(t.getCreatedAt())
      .build();
  }
}
