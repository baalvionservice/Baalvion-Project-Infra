package com.baalvion.credit.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

/** Create a trade BNPL facility for a buyer; the merchant is paid the principal up-front. */
@Data
public class CreateBnplPlanRequest {

  private String idempotencyKey;

  private String orderRef;

  private UUID buyerId;

  @NotBlank
  private String buyerName;

  private UUID merchantId;

  @NotBlank
  private String merchantName;

  @NotNull
  @DecimalMin(value = "0.0001", message = "principal must be positive")
  private BigDecimal principal;

  @NotBlank
  @Size(min = 3, max = 3, message = "currency must be a 3-letter ISO code")
  private String currency;

  /** BULLET (single payment at tenor) or INSTALLMENTS (equal monthly installments). */
  @NotBlank
  private String termType;

  /** Number of installments (INSTALLMENTS only); ignored for BULLET. */
  @Min(value = 1, message = "installmentCount must be >= 1")
  private int installmentCount = 1;

  /** Bullet tenor in days (BULLET only); e.g. 30/60/90. INSTALLMENTS use monthly intervals. */
  private Integer tenorDays;

  private String metadata;
}
