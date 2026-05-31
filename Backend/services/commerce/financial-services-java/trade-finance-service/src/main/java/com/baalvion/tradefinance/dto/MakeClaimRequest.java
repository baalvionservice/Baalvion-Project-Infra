package com.baalvion.tradefinance.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/** Beneficiary demand (claim) under a bank guarantee. */
@Data
public class MakeClaimRequest {

  @NotNull
  @DecimalMin(value = "0.0001", message = "claimAmount must be positive")
  private BigDecimal claimAmount;

  /** Statement of default / breach required by URDG 758 art.15. */
  private String statement;

  private List<String> supportingDocuments;
}
