package com.baalvion.tradefinance.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Propose an amendment to an issued credit. At least one change must be supplied. */
@Data
public class AmendLcRequest {
  /** New credit amount (increase/decrease); null leaves it unchanged. */
  private BigDecimal newAmount;
  /** New expiry date (extension); null leaves it unchanged. */
  private LocalDate newExpiryDate;
  /** Free-form structured changes (e.g. document list, shipment terms) as JSON. */
  private String changes;
  private String reason;
}
