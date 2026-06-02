package com.baalvion.smartcontract.dto;

import com.baalvion.smartcontract.domain.TradeContract;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class ContractResponse {
  private UUID id;
  private UUID tenantId;
  private String contractNumber;
  private String originType;
  private UUID dealId;
  private UUID termSheetId;
  private UUID buyerId;
  private String buyerName;
  private UUID sellerId;
  private String sellerName;
  private String commodity;
  private String description;
  private BigDecimal quantity;
  private String unit;
  private BigDecimal price;
  private String currency;
  private BigDecimal totalValue;
  private String incoterm;
  private String namedPlace;
  private String paymentMethod;
  private LocalDate deliveryDate;
  private String portOfLoading;
  private String portOfDischarge;
  private String governingLaw;
  private String disputeResolution;
  private String clauses;
  private String status;
  private String envelopeId;
  private String esignProvider;
  private LocalDateTime issuedAt;
  private LocalDateTime executedAt;
  private LocalDateTime createdAt;
  private List<SignatureResponse> signatures;

  public static ContractResponse from(TradeContract c) {
    return from(c, null);
  }

  public static ContractResponse from(TradeContract c, List<SignatureResponse> signatures) {
    return ContractResponse.builder()
      .id(c.getId()).tenantId(c.getTenantId()).contractNumber(c.getContractNumber())
      .originType(c.getOriginType() != null ? c.getOriginType().name() : null)
      .dealId(c.getDealId()).termSheetId(c.getTermSheetId())
      .buyerId(c.getBuyerId()).buyerName(c.getBuyerName())
      .sellerId(c.getSellerId()).sellerName(c.getSellerName())
      .commodity(c.getCommodity()).description(c.getDescription())
      .quantity(c.getQuantity()).unit(c.getUnit()).price(c.getPrice())
      .currency(c.getCurrency()).totalValue(c.getTotalValue())
      .incoterm(c.getIncoterm() != null ? c.getIncoterm().name() : null).namedPlace(c.getNamedPlace())
      .paymentMethod(c.getPaymentMethod() != null ? c.getPaymentMethod().name() : null)
      .deliveryDate(c.getDeliveryDate()).portOfLoading(c.getPortOfLoading()).portOfDischarge(c.getPortOfDischarge())
      .governingLaw(c.getGoverningLaw()).disputeResolution(c.getDisputeResolution())
      .clauses(c.getClauses())
      .status(c.getStatus() != null ? c.getStatus().name() : null)
      .envelopeId(c.getEnvelopeId()).esignProvider(c.getEsignProvider())
      .issuedAt(c.getIssuedAt()).executedAt(c.getExecutedAt()).createdAt(c.getCreatedAt())
      .signatures(signatures)
      .build();
  }
}
