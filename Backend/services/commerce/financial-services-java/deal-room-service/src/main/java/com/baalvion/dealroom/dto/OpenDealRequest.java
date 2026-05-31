package com.baalvion.dealroom.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

/** Opens a deal room between a buyer and a seller, optionally seeding the first offer. */
@Data
public class OpenDealRequest {

  private String idempotencyKey;

  /** LISTING, RFQ, DIRECT */
  private String originType;
  private UUID originId;

  @NotBlank
  private String title;
  private String commodity;

  @NotNull
  private UUID buyerId;
  private String buyerName;

  @NotNull
  private UUID sellerId;
  private String sellerName;

  @NotBlank
  @Size(min = 3, max = 3, message = "currency must be a 3-letter ISO code")
  private String currency;

  private String unit;
  private String incoterm;

  /** Which side is opening the room and (if seeding) making the first offer: BUYER or SELLER. */
  @NotBlank
  private String openingParty;

  /** Optional seeded first offer. */
  private BigDecimal initialPrice;
  private BigDecimal initialQuantity;
  private String message;

  /** Room lifetime override (hours); defaults to the configured TTL. */
  private Integer ttlHours;

  private String metadata;
}
