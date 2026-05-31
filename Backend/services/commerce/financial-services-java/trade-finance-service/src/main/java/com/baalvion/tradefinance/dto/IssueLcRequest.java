package com.baalvion.tradefinance.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Request to open a documentary credit. The credit is created in DRAFT and then issued. */
@Data
public class IssueLcRequest {

  private String idempotencyKey;

  @NotBlank
  private String lcType; // SIGHT, USANCE, DEFERRED, REVOLVING, TRANSFERABLE, STANDBY

  private UUID applicantId;

  @NotBlank
  private String applicantName;

  private UUID beneficiaryId;

  @NotBlank
  private String beneficiaryName;

  private String issuingBank;
  private String advisingBank;
  private String confirmingBank;

  @NotNull
  @DecimalMin(value = "0.0001", message = "amount must be positive")
  private BigDecimal amount;

  @NotBlank
  @Size(min = 3, max = 3, message = "currency must be a 3-letter ISO code")
  private String currency;

  /** Credit amount tolerance percentage (UCP 600 art.30), e.g. 5 means +/-5%. */
  private BigDecimal tolerancePct;

  private String incoterm;
  private String goodsDescription;
  private String portOfLoading;
  private String portOfDischarge;
  private boolean partialShipmentAllowed;
  private boolean transhipmentAllowed;
  private LocalDate latestShipmentDate;

  @NotNull
  private LocalDate expiryDate;

  private String expiryPlace;

  private List<String> requiredDocuments;

  /** Optional override for the cash-margin rate; defaults to the configured platform rate. */
  private BigDecimal marginRate;

  private String metadata;
}
