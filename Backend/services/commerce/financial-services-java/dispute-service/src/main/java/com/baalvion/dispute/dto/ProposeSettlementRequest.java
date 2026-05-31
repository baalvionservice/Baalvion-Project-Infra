package com.baalvion.dispute.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;

/** A mediator's proposed settlement (Tier 2). */
@Data
public class ProposeSettlementRequest {

  /** BUYER, SELLER or SPLIT. */
  @NotBlank
  private String inFavorOf;

  private BigDecimal amount;

  private String terms;
}
