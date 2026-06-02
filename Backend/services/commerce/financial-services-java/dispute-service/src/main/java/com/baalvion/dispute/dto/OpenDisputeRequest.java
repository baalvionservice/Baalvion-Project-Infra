package com.baalvion.dispute.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/** Raise a dispute against an order/deal/contract/shipment. */
@Data
public class OpenDisputeRequest {

  private String idempotencyKey;

  /** ORDER, DEAL, CONTRACT, SHIPMENT */
  @NotBlank
  private String subjectType;
  private UUID subjectId;

  /** Which side is raising it: BUYER or SELLER. */
  @NotBlank
  private String raisedBy;

  private UUID claimantId;
  private String claimantName;
  private UUID respondentId;
  private String respondentName;

  /** QUALITY, NON_DELIVERY, PAYMENT, DOCUMENTATION, QUANTITY, OTHER */
  @NotBlank
  private String type;

  private BigDecimal amount;
  private String currency;

  @NotBlank
  private String description;

  /** Document/evidence references attached to the claim. */
  private List<String> evidence;

  private String metadata;
}
