package com.baalvion.smartcontract.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/** Generates a sale contract, typically from an agreed deal/term-sheet. */
@Data
public class CreateContractRequest {

  private String idempotencyKey;

  /** DEAL, TERM_SHEET, ORDER, MANUAL */
  private String originType;
  private UUID originId;
  private UUID dealId;
  private UUID termSheetId;

  @NotNull
  private UUID buyerId;
  @NotBlank
  private String buyerName;
  @NotNull
  private UUID sellerId;
  @NotBlank
  private String sellerName;

  private String commodity;
  private String description;

  @NotNull
  @DecimalMin(value = "0.0001", message = "quantity must be positive")
  private BigDecimal quantity;
  private String unit;

  @NotNull
  @DecimalMin(value = "0.0001", message = "price must be positive")
  private BigDecimal price;

  @NotBlank
  @Size(min = 3, max = 3, message = "currency must be a 3-letter ISO code")
  private String currency;

  /** Incoterms 2020: EXW, FCA, CPT, CIP, DAP, DPU, DDP, FAS, FOB, CFR, CIF. */
  @NotBlank
  private String incoterm;
  private String namedPlace;

  /** LC, BG, TT, OA, BNPL, ESCROW. */
  private String paymentMethod;

  private LocalDate deliveryDate;
  private String portOfLoading;
  private String portOfDischarge;
  private String governingLaw;
  private String disputeResolution;

  // Signer routing (for e-signature).
  private String buyerSignerName;
  private String buyerSignerEmail;
  private String sellerSignerName;
  private String sellerSignerEmail;

  private String metadata;
}
