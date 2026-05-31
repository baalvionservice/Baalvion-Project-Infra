package com.baalvion.risk.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/** Request to screen a subject against the consolidated watchlist. */
@Data
public class ScreenRequest {

  @NotBlank(message = "name is required")
  private String name;

  /** INDIVIDUAL | ORGANIZATION | VESSEL | AIRCRAFT | OTHER (defaults to INDIVIDUAL if blank). */
  private String type;

  private String country;

  /** Optional caller correlation, e.g. ACCOUNT / DEAL / COUNTERPARTY. */
  private String referenceType;
  private String referenceId;
}
