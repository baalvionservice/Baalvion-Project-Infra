package com.baalvion.dispute.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;

/** An arbitrator's binding award (Tier 3). */
@Data
public class AwardRequest {

  /** BUYER, SELLER or SPLIT. */
  @NotBlank
  private String inFavorOf;

  private BigDecimal amount;

  @NotBlank
  private String reasoning;
}
