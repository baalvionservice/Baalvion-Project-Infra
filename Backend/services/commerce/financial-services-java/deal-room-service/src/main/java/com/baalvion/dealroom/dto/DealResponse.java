package com.baalvion.dealroom.dto;

import com.baalvion.dealroom.domain.DealRoom;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class DealResponse {
  private UUID id;
  private UUID tenantId;
  private String reference;
  private String originType;
  private UUID originId;
  private String title;
  private String commodity;
  private UUID buyerId;
  private String buyerName;
  private UUID sellerId;
  private String sellerName;
  private String status;
  private BigDecimal currentPrice;
  private BigDecimal currentQuantity;
  private String unit;
  private String currency;
  private String incoterm;
  private String currentOfferBy;
  private int roundCount;
  private UUID termSheetId;
  private LocalDateTime agreedAt;
  private LocalDateTime expiresAt;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;

  public static DealResponse from(DealRoom d) {
    return DealResponse.builder()
      .id(d.getId()).tenantId(d.getTenantId()).reference(d.getReference())
      .originType(d.getOriginType() != null ? d.getOriginType().name() : null).originId(d.getOriginId())
      .title(d.getTitle()).commodity(d.getCommodity())
      .buyerId(d.getBuyerId()).buyerName(d.getBuyerName())
      .sellerId(d.getSellerId()).sellerName(d.getSellerName())
      .status(d.getStatus() != null ? d.getStatus().name() : null)
      .currentPrice(d.getCurrentPrice()).currentQuantity(d.getCurrentQuantity())
      .unit(d.getUnit()).currency(d.getCurrency()).incoterm(d.getIncoterm())
      .currentOfferBy(d.getCurrentOfferBy() != null ? d.getCurrentOfferBy().name() : null)
      .roundCount(d.getRoundCount()).termSheetId(d.getTermSheetId())
      .agreedAt(d.getAgreedAt()).expiresAt(d.getExpiresAt())
      .createdAt(d.getCreatedAt()).updatedAt(d.getUpdatedAt())
      .build();
  }
}
