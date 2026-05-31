package com.baalvion.paymentrails.dto;

import com.baalvion.paymentrails.domain.PaymentInstruction;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class PaymentResponse {
  private UUID id;
  private UUID tenantId;
  private String reference;
  private String direction;
  private String creditorName;
  private String creditorCountry;
  private BigDecimal amount;
  private String currency;
  private String purpose;
  private String urgency;
  private String requestedRail;
  private String rail;
  private String railRef;
  private BigDecimal feeAmount;
  private String feeCurrency;
  private String provider;
  private String status;
  private String routingNote;
  private String failureReason;
  private LocalDateTime submittedAt;
  private LocalDateTime settledAt;
  private LocalDateTime createdAt;

  public static PaymentResponse from(PaymentInstruction p) {
    return PaymentResponse.builder()
      .id(p.getId()).tenantId(p.getTenantId()).reference(p.getReference())
      .direction(p.getDirection() != null ? p.getDirection().name() : null)
      .creditorName(p.getCreditorName()).creditorCountry(p.getCreditorCountry())
      .amount(p.getAmount()).currency(p.getCurrency()).purpose(p.getPurpose())
      .urgency(p.getUrgency() != null ? p.getUrgency().name() : null)
      .requestedRail(p.getRequestedRail() != null ? p.getRequestedRail().name() : null)
      .rail(p.getRail() != null ? p.getRail().name() : null)
      .railRef(p.getRailRef()).feeAmount(p.getFeeAmount()).feeCurrency(p.getFeeCurrency()).provider(p.getProvider())
      .status(p.getStatus() != null ? p.getStatus().name() : null)
      .routingNote(p.getRoutingNote()).failureReason(p.getFailureReason())
      .submittedAt(p.getSubmittedAt()).settledAt(p.getSettledAt()).createdAt(p.getCreatedAt())
      .build();
  }
}
