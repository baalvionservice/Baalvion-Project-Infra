package com.baalvion.tradefinance.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/** Beneficiary presents documents to draw (fully or partially) on the credit. */
@Data
public class PresentDocumentsRequest {

  @NotNull
  @DecimalMin(value = "0.0001", message = "presentedAmount must be positive")
  private BigDecimal presentedAmount;

  /** Documents tendered (e.g. ["COMMERCIAL_INVOICE","BILL_OF_LADING","PACKING_LIST"]). */
  private List<String> documents;
}
