package com.baalvion.dealroom.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

/** A negotiation round: the proposing party puts new terms on the table. */
@Data
public class CounterOfferRequest {

  /** BUYER or SELLER — the side making this counter-offer. */
  @NotBlank
  private String party;

  @NotNull
  @DecimalMin(value = "0.0001", message = "price must be positive")
  private BigDecimal price;

  @NotNull
  @DecimalMin(value = "0.0001", message = "quantity must be positive")
  private BigDecimal quantity;

  private String unit;
  private String incoterm;
  private String deliveryTerms;
  private String paymentTerms;
  private String message;

  /** Validity window of this offer in hours; defaults to the configured window. */
  private Integer validForHours;
}
