package com.baalvion.risk.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/** Compliance-officer decision on a potential/confirmed match. */
@Data
public class AdjudicateRequest {

  /** true → confirm a true hit (BLOCKED); false → clear as a false positive (FALSE_POSITIVE). */
  @NotNull(message = "confirmed is required")
  private Boolean confirmed;

  private String note;
}
